import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get agent statistics
    const { data: agents } = await supabase
      .from('agent_metadata')
      .select('*')
      .order('last_active_at', { ascending: false });

    const activeAgents = agents?.filter(a => a.activity_state === 'active') || [];
    const idleAgents = agents?.filter(a => a.activity_state === 'idle') || [];
    const terminatedAgents = agents?.filter(a => a.activity_state === 'terminated') || [];

    const totalMemory = agents?.reduce((sum, a) => sum + (a.memory_mb || 0), 0) || 0;
    const avgCpuUsage = agents && agents.length > 0 
      ? agents.reduce((sum, a) => sum + (a.cpu_usage || 0), 0) / agents.length 
      : 0;
    const avgLatency = activeAgents.length > 0
      ? activeAgents.reduce((sum, a) => sum + (a.response_latency_ms || 0), 0) / activeAgents.length
      : 0;

    // Get cache statistics
    const { data: queryCache, count: queryCacheCount } = await supabase
      .from('query_cache')
      .select('*', { count: 'exact' });

    const { data: embeddingsCache, count: embeddingsCacheCount } = await supabase
      .from('embeddings_cache')
      .select('*', { count: 'exact' });

    const verifiedQueries = queryCache?.filter(q => q.verification_status === 'verified').length || 0;
    const avgConfidence = queryCache && queryCache.length > 0
      ? queryCache.reduce((sum, q) => sum + parseFloat(q.confidence_score || '0'), 0) / queryCache.length
      : 0;

    const totalCacheHits = (queryCache?.reduce((sum, q) => sum + (q.access_count || 0), 0) || 0) +
                          (embeddingsCache?.reduce((sum, e) => sum + (e.access_count || 0), 0) || 0);

    // Get confidence scores
    const { data: confidenceScores } = await supabase
      .from('confidence_scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const hallucination_prevention = {
      total_queries_verified: confidenceScores?.length || 0,
      passed_validation: confidenceScores?.filter(c => c.passed_validation).length || 0,
      avg_improvement: confidenceScores && confidenceScores.length > 0
        ? confidenceScores.reduce((sum, c) => sum + (c.final_score - c.initial_score), 0) / confidenceScores.length
        : 0,
      total_reprompts: confidenceScores?.reduce((sum, c) => sum + (c.reprompt_count || 0), 0) || 0
    };

    // Get recent logs
    const { data: recentLogs } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const logCounts = {
      optimization: recentLogs?.filter(l => l.log_type === 'optimization').length || 0,
      cache_hits: recentLogs?.filter(l => l.log_type === 'cache_hit').length || 0,
      cache_misses: recentLogs?.filter(l => l.log_type === 'cache_miss').length || 0,
      errors: recentLogs?.filter(l => l.log_type === 'error').length || 0
    };

    const cacheHitRate = logCounts.cache_hits + logCounts.cache_misses > 0
      ? (logCounts.cache_hits / (logCounts.cache_hits + logCounts.cache_misses) * 100).toFixed(2)
      : '0.00';

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        agents: {
          total: agents?.length || 0,
          active: activeAgents.length,
          idle: idleAgents.length,
          terminated: terminatedAgents.length,
          details: agents?.map(a => ({
            agent_id: a.agent_id,
            state: a.activity_state,
            cpu_usage: a.cpu_usage,
            memory_mb: a.memory_mb,
            latency_ms: a.response_latency_ms,
            last_active: a.last_active_at
          }))
        },
        performance: {
          total_memory_mb: totalMemory,
          avg_cpu_usage: parseFloat(avgCpuUsage.toFixed(2)),
          avg_response_latency_ms: Math.round(avgLatency)
        },
        cache: {
          query_cache_size: queryCacheCount || 0,
          embeddings_cache_size: embeddingsCacheCount || 0,
          verified_queries: verifiedQueries,
          avg_confidence: parseFloat(avgConfidence.toFixed(2)),
          total_cache_hits: totalCacheHits,
          cache_hit_rate: `${cacheHitRate}%`
        },
        hallucination_prevention,
        logs: {
          recent_count: recentLogs?.length || 0,
          counts: logCounts,
          recent_entries: recentLogs?.slice(0, 5).map(l => ({
            type: l.log_type,
            message: l.message,
            timestamp: l.created_at
          }))
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in system-stats:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
