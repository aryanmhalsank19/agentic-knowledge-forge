import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { reloadCacheSchema, createErrorResponse } from "../_shared/validation.ts";

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

    // Verify authentication and check admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse(401, 'Authentication required', corsHeaders);
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return createErrorResponse(403, 'Admin access required', corsHeaders);
    }

    // Parse and validate input
    const body = await req.json();
    const validated = reloadCacheSchema.parse(body);
    const { cacheType, minAccessCount } = validated;

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
    console.error('Error in reload-cache:', error);
    return createErrorResponse(500, 'Cache reload failed', corsHeaders);
  }
});
