-- Documents table (stores uploaded/processed documents)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Entities table (extracted knowledge graph nodes)
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  domain TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Relationships table (knowledge graph edges)
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ontologies table (domain-specific schemas)
CREATE TABLE IF NOT EXISTS public.ontologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontologies ENABLE ROW LEVEL SECURITY;

-- Public policies for demo/testing
CREATE POLICY "Allow public read on documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert on documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on documents" ON public.documents FOR UPDATE USING (true);

CREATE POLICY "Allow public read on entities" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Allow public insert on entities" ON public.entities FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on relationships" ON public.relationships FOR SELECT USING (true);
CREATE POLICY "Allow public insert on relationships" ON public.relationships FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on ontologies" ON public.ontologies FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ontologies" ON public.ontologies FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_entities_domain ON public.entities(domain);
CREATE INDEX idx_entities_type ON public.entities(type);
CREATE INDEX idx_relationships_source ON public.relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON public.relationships(target_entity_id);
CREATE INDEX idx_documents_domain ON public.documents(domain);
CREATE INDEX idx_documents_status ON public.documents(status);