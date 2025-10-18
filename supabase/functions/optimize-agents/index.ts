import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { optimizeAgentsSchema, createErrorResponse } from "../_shared/validation.ts";

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
    const validated = optimizeAgentsSchema.parse(body);
    const { inactiveThresholdMinutes } = validated;

    // Find idle agents that haven't been active recently
    const thresholdTime = new Date(Date.now() - inactiveThresholdMinutes * 60 * 1000);
    
    const { data: idleAgents } = await supabase
      .from('agent_metadata')
      .select('*')
      .eq('activity_state', 'idle')
      .lt('last_active_at', thresholdTime.toISOString());

    let terminatedCount = 0;
    let memoryFreed = 0;

    if (idleAgents && idleAgents.length > 0) {
      for (const agent of idleAgents) {
        await supabase
          .from('agent_metadata')
          .update({ activity_state: 'terminated' })
          .eq('id', agent.id);
        
        terminatedCount++;
        memoryFreed += agent.memory_mb || 0;
      }

      await supabase.from('system_logs').insert({
        log_type: 'agent_cleanup',
        message: `Terminated ${terminatedCount} idle agents, freed ${memoryFreed}MB memory`,
        metadata: { 
          terminated_agents: idleAgents.map(a => a.agent_id),
          memory_freed_mb: memoryFreed
        }
      });
    }

    // Mark active agents as idle if they haven't been used recently
    const { data: activeAgents } = await supabase
      .from('agent_metadata')
      .select('*')
      .eq('activity_state', 'active')
      .lt('last_active_at', thresholdTime.toISOString());

    let idledCount = 0;
    if (activeAgents && activeAgents.length > 0) {
      for (const agent of activeAgents) {
        await supabase
          .from('agent_metadata')
          .update({ 
            activity_state: 'idle',
            cpu_usage: 0,
            memory_mb: Math.floor(agent.memory_mb * 0.5)
          })
          .eq('id', agent.id);
        idledCount++;
      }
    }

    // Get current system stats
    const { data: allAgents } = await supabase
      .from('agent_metadata')
      .select('*');

    const stats = {
      total_agents: allAgents?.length || 0,
      active_agents: allAgents?.filter(a => a.activity_state === 'active').length || 0,
      idle_agents: allAgents?.filter(a => a.activity_state === 'idle').length || 0,
      terminated_agents: allAgents?.filter(a => a.activity_state === 'terminated').length || 0,
      total_memory_mb: allAgents?.reduce((sum, a) => sum + (a.memory_mb || 0), 0) || 0,
      avg_cpu_usage: allAgents?.reduce((sum, a) => sum + (a.cpu_usage || 0), 0) / (allAgents?.length || 1)
    };

    await supabase.from('system_logs').insert({
      log_type: 'optimization',
      message: `Optimization complete: terminated ${terminatedCount}, idled ${idledCount} agents`,
      metadata: { 
        ...stats,
        memory_freed_mb: memoryFreed,
        optimization_timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        optimization: {
          terminated_count: terminatedCount,
          idled_count: idledCount,
          memory_freed_mb: memoryFreed
        },
        system_stats: stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in optimize-agents:', error);
    return createErrorResponse(500, 'Optimization failed', corsHeaders);
  }
});
