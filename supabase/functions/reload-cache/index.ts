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

    const { cacheType = 'all', minAccessCount = 1 } = await req.json();

    let queryReloaded = 0;
    let embeddingsReloaded = 0;

    // Reload query cache
    if (cacheType === 'all' || cacheType === 'queries') {
      const { data: queries } = await supabase
        .from('query_cache')
        .select('*')
        .gte('access_count', minAccessCount);

      if (queries) {
        queryReloaded = queries.length;
        console.log(`Reloaded ${queryReloaded} query cache entries`);
      }
    }

    // Reload embeddings cache
    if (cacheType === 'all' || cacheType === 'embeddings') {
      const { data: embeddings } = await supabase
        .from('embeddings_cache')
        .select('*')
        .gte('access_count', minAccessCount);

      if (embeddings) {
        embeddingsReloaded = embeddings.length;
        console.log(`Reloaded ${embeddingsReloaded} embedding cache entries`);
      }
    }

    // Clean up old cache entries (older than 30 days with no access)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: deletedQueries } = await supabase
      .from('query_cache')
      .delete()
      .eq('access_count', 0)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select();

    const { data: deletedEmbeddings } = await supabase
      .from('embeddings_cache')
      .delete()
      .eq('access_count', 0)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select();

    const deletedCount = (deletedQueries?.length || 0) + (deletedEmbeddings?.length || 0);

    await supabase.from('system_logs').insert({
      log_type: 'optimization',
      message: `Cache reload complete: ${queryReloaded} queries, ${embeddingsReloaded} embeddings reloaded. ${deletedCount} old entries cleaned.`,
      metadata: {
        query_reloaded: queryReloaded,
        embeddings_reloaded: embeddingsReloaded,
        deleted_count: deletedCount,
        cache_type: cacheType
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        reloaded: {
          queries: queryReloaded,
          embeddings: embeddingsReloaded
        },
        cleaned: deletedCount,
        cache_type: cacheType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in reload-cache:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
