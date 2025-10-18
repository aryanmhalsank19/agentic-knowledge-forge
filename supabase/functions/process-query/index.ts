import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { processQuerySchema, createErrorResponse } from "../_shared/validation.ts";

// Hash function for caching
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function calculateConfidenceScore(response: any): number {
  const content = response.choices?.[0]?.message?.content || '';
  const length = content.length;
  const hasSpecifics = /\d{4}|\d+%|\$\d+/.test(content);
  const hasCitations = /according to|based on|study shows/i.test(content);
  const hasUncertainty = /may|might|possibly|unclear|uncertain/i.test(content);
  
  let score = 0.5;
  if (length > 200) score += 0.15;
  if (hasSpecifics) score += 0.15;
  if (hasCitations) score += 0.1;
  if (hasUncertainty) score -= 0.2;
  
  return Math.max(0, Math.min(1, score));
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create authenticated Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify authentication and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse(401, 'Authentication required', corsHeaders);
    }

    // Parse and validate input
    const body = await req.json();
    const validated = processQuerySchema.parse(body);
    const { query, domain, useCache } = validated;

    const queryHash = await hashText(query);

    // Check cache if enabled
    if (useCache) {
      const { data: cachedResult } = await supabase
        .from('query_cache')
        .select('*')
        .eq('query_hash', queryHash)
        .eq('user_id', user.id)
        .eq('verification_status', 'verified')
        .single();

      if (cachedResult) {
        await supabase
          .from('query_cache')
          .update({ 
            access_count: cachedResult.access_count + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', cachedResult.id);

        return new Response(
          JSON.stringify({
            response: cachedResult.response_text,
            confidence: parseFloat(cachedResult.confidence_score),
            cached: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Call Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return createErrorResponse(500, 'Service temporarily unavailable', corsHeaders);
    }

    const systemPrompt = `You are a knowledgeable assistant specializing in ${domain || 'general knowledge'}. 
Provide accurate, fact-based answers with specific details when available. 
If you're uncertain, acknowledge it clearly.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI Gateway error:', aiResponse.status);
      if (aiResponse.status === 429) {
        return createErrorResponse(429, 'Rate limit exceeded. Please try again later.', corsHeaders);
      }
      if (aiResponse.status === 402) {
        return createErrorResponse(402, 'Service quota exceeded. Please contact support.', corsHeaders);
      }
      return createErrorResponse(500, 'Service temporarily unavailable', corsHeaders);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content;
    let confidence = calculateConfidenceScore(aiData);

    // Hallucination reduction: re-prompt if confidence is low
    let repromptCount = 0;
    if (confidence < 0.6) {
      const verificationPrompt = `Review this response for accuracy: "${responseText}". 
Is it factual? Provide an improved, more accurate version if needed.`;
      
      const verificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: verificationPrompt }],
        }),
      });

      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        confidence = calculateConfidenceScore(verificationData);
        repromptCount = 1;
      }
    }

    // Store in cache
    await supabase.from('query_cache').insert({
      query_hash: queryHash,
      query_text: query,
      response_text: responseText,
      confidence_score: confidence,
      verification_status: confidence >= 0.6 ? 'verified' : 'pending',
      user_id: user.id,
      access_count: 1,
    });

    return new Response(
      JSON.stringify({
        response: responseText,
        confidence,
        cached: false,
        reprompted: repromptCount > 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-query:', error);
    return createErrorResponse(500, 'Request could not be processed', corsHeaders);
  }
});
