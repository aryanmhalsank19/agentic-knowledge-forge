-- Agent Metadata Table (tracks Gemini agent performance)
CREATE TABLE IF NOT EXISTS public.agent_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT UNIQUE NOT NULL,
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_mb INTEGER DEFAULT 0,
  response_latency_ms INTEGER DEFAULT 0,
  activity_state TEXT DEFAULT 'idle' CHECK (activity_state IN ('active', 'idle', 'terminated')),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  uptime_seconds INTEGER DEFAULT 0
);

-- Embeddings Cache (stores embeddings with compression and deduplication)
CREATE TABLE IF NOT EXISTS public.embeddings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT UNIQUE NOT NULL,
  content_text TEXT NOT NULL,
  embedding_vector JSONB NOT NULL,
  domain TEXT,
  compressed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  access_count INTEGER DEFAULT 0
);

-- Query Response Cache (stores verified responses)
CREATE TABLE IF NOT EXISTS public.query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  query_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  access_count INTEGER DEFAULT 0
);

-- Confidence Scores (hallucination reduction tracking)
CREATE TABLE IF NOT EXISTS public.confidence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES public.query_cache(id) ON DELETE CASCADE,
  initial_score DECIMAL(3,2) NOT NULL,
  final_score DECIMAL(3,2) NOT NULL,
  reprompt_count INTEGER DEFAULT 0,
  verification_method TEXT DEFAULT 'probability',
  passed_validation BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System Performance Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL CHECK (log_type IN ('optimization', 'cache_hit', 'cache_miss', 'agent_cleanup', 'error')),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confidence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for system monitoring
CREATE POLICY "Allow public read on agent_metadata" ON public.agent_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public read on embeddings_cache" ON public.embeddings_cache FOR SELECT USING (true);
CREATE POLICY "Allow public read on query_cache" ON public.query_cache FOR SELECT USING (true);
CREATE POLICY "Allow public read on confidence_scores" ON public.confidence_scores FOR SELECT USING (true);
CREATE POLICY "Allow public read on system_logs" ON public.system_logs FOR SELECT USING (true);

-- Allow inserts for all tables (backend functions will insert)
CREATE POLICY "Allow public insert on agent_metadata" ON public.agent_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on embeddings_cache" ON public.embeddings_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on query_cache" ON public.query_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on confidence_scores" ON public.confidence_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on system_logs" ON public.system_logs FOR INSERT WITH CHECK (true);

-- Allow updates for cache access tracking
CREATE POLICY "Allow public update on embeddings_cache" ON public.embeddings_cache FOR UPDATE USING (true);
CREATE POLICY "Allow public update on query_cache" ON public.query_cache FOR UPDATE USING (true);
CREATE POLICY "Allow public update on agent_metadata" ON public.agent_metadata FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX idx_embeddings_content_hash ON public.embeddings_cache(content_hash);
CREATE INDEX idx_query_cache_hash ON public.query_cache(query_hash);
CREATE INDEX idx_agent_activity ON public.agent_metadata(activity_state, last_active_at);
CREATE INDEX idx_system_logs_type ON public.system_logs(log_type, created_at DESC);