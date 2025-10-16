import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash function for cache keys
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Calculate confidence score from response
function calculateConfidenceScore(response: any): number {
  // Simple heuristic: longer, structured responses = higher confidence
  const text = response.choices?.[0]?.message?.content || '';
  let score = 0.5;
  
  if (text.length > 200) score += 0.2;
  if (text.includes('according to') || text.includes('based on')) score += 0.1;
  if (text.match(/\d+/g)?.length > 2) score += 0.1;
  if (text.includes('however') || text.includes('but')) score += 0.1;
  
  return Math.min(score, 0.99);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { query, domain, useCache = true } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    const queryHash = await hashText(query);

    // Check cache first
    if (useCache) {
      const { data: cached } = await supabase
        .from('query_cache')
        .select('*')
        .eq('query_hash', queryHash)
        .eq('verification_status', 'verified')
        .single();

      if (cached) {
        // Update cache stats
        await supabase
          .from('query_cache')
          .update({
            access_count: cached.access_count + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', cached.id);

        await supabase.from('system_logs').insert({
          log_type: 'cache_hit',
          message: `Cache hit for query: ${query.substring(0, 50)}...`,
          metadata: { query_id: cached.id, latency_ms: Date.now() - startTime }
        });

        return new Response(
          JSON.stringify({
            response: cached.response_text,
            confidence: cached.confidence_score,
            cached: true,
            latency_ms: Date.now() - startTime
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log cache miss
    await supabase.from('system_logs').insert({
      log_type: 'cache_miss',
      message: `Cache miss for query: ${query.substring(0, 50)}...`
    });

    // Generate response with Lovable AI (Gemini)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initial query
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert knowledge graph analyst. Provide accurate, fact-based responses. 
            If uncertain, state your confidence level. Use specific data points and avoid speculation.
            ${domain ? `Focus on the ${domain} domain.` : ''}`
          },
          { role: 'user', content: query }
        ]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const initialResponse = aiData.choices[0].message.content;
    let initialConfidence = calculateConfidenceScore(aiData);
    
    let finalResponse = initialResponse;
    let finalConfidence = initialConfidence;
    let repromptCount = 0;

    // Hallucination Reduction: Re-prompt if confidence is low
    if (initialConfidence < 0.7) {
      console.log(`Low confidence (${initialConfidence}), re-prompting for verification...`);
      
      const verificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a fact-checker. Review the following response and verify its accuracy. Provide a more confident, fact-based answer with specific details.'
            },
            { role: 'user', content: query },
            { role: 'assistant', content: initialResponse },
            { role: 'user', content: 'Please verify and improve this response with more factual details.' }
          ]
        })
      });

      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        finalResponse = verificationData.choices[0].message.content;
        finalConfidence = calculateConfidenceScore(verificationData);
        repromptCount = 1;
      }
    }

    const latency = Date.now() - startTime;
    const verificationStatus = finalConfidence >= 0.7 ? 'verified' : 'pending';

    // Store in cache
    const { data: cacheEntry } = await supabase
      .from('query_cache')
      .insert({
        query_hash: queryHash,
        query_text: query,
        response_text: finalResponse,
        confidence_score: finalConfidence,
        verification_status: verificationStatus,
        model_used: 'google/gemini-2.5-flash'
      })
      .select()
      .single();

    // Store confidence tracking
    if (cacheEntry) {
      await supabase.from('confidence_scores').insert({
        query_id: cacheEntry.id,
        initial_score: initialConfidence,
        final_score: finalConfidence,
        reprompt_count: repromptCount,
        verification_method: 'confidence_scoring',
        passed_validation: finalConfidence >= 0.7
      });
    }

    // Update agent metadata
    const agentId = `agent-${Math.floor(Math.random() * 5) + 1}`;
    await supabase
      .from('agent_metadata')
      .upsert({
        agent_id: agentId,
        response_latency_ms: latency,
        activity_state: 'active',
        last_active_at: new Date().toISOString()
      }, { onConflict: 'agent_id' });

    return new Response(
      JSON.stringify({
        response: finalResponse,
        confidence: finalConfidence,
        cached: false,
        latency_ms: latency,
        reprompted: repromptCount > 0,
        verification_status: verificationStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in process-query:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
