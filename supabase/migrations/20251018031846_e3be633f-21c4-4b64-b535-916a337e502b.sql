-- =============================================================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- =============================================================================

-- 1. Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create profiles table for user metadata
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Create user_roles table with security definer function to prevent RLS recursion
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Add user_id columns to user-owned tables
ALTER TABLE public.documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.query_cache ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.embeddings_cache ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. DROP existing overly permissive RLS policies

-- documents policies
DROP POLICY IF EXISTS "Allow public insert on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow public read on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow public update on documents" ON public.documents;

-- query_cache policies
DROP POLICY IF EXISTS "Allow public insert on query_cache" ON public.query_cache;
DROP POLICY IF EXISTS "Allow public read on query_cache" ON public.query_cache;
DROP POLICY IF EXISTS "Allow public update on query_cache" ON public.query_cache;

-- embeddings_cache policies
DROP POLICY IF EXISTS "Allow public insert on embeddings_cache" ON public.embeddings_cache;
DROP POLICY IF EXISTS "Allow public read on embeddings_cache" ON public.embeddings_cache;
DROP POLICY IF EXISTS "Allow public update on embeddings_cache" ON public.embeddings_cache;

-- entities policies
DROP POLICY IF EXISTS "Allow public insert on entities" ON public.entities;
DROP POLICY IF EXISTS "Allow public read on entities" ON public.entities;

-- relationships policies
DROP POLICY IF EXISTS "Allow public insert on relationships" ON public.relationships;
DROP POLICY IF EXISTS "Allow public read on relationships" ON public.relationships;

-- ontologies policies
DROP POLICY IF EXISTS "Allow public insert on ontologies" ON public.ontologies;
DROP POLICY IF EXISTS "Allow public read on ontologies" ON public.ontologies;

-- agent_metadata policies
DROP POLICY IF EXISTS "Allow public insert on agent_metadata" ON public.agent_metadata;
DROP POLICY IF EXISTS "Allow public read on agent_metadata" ON public.agent_metadata;
DROP POLICY IF EXISTS "Allow public update on agent_metadata" ON public.agent_metadata;

-- confidence_scores policies
DROP POLICY IF EXISTS "Allow public insert on confidence_scores" ON public.confidence_scores;
DROP POLICY IF EXISTS "Allow public read on confidence_scores" ON public.confidence_scores;

-- system_logs policies
DROP POLICY IF EXISTS "Allow public insert on system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "Allow public read on system_logs" ON public.system_logs;

-- 6. Create secure RLS policies for user-owned tables

-- documents: users can manage their own documents
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- query_cache: users can manage their own queries
CREATE POLICY "Users can view their own query cache"
  ON public.query_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own query cache"
  ON public.query_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own query cache"
  ON public.query_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- embeddings_cache: users can manage their own embeddings
CREATE POLICY "Users can view their own embeddings"
  ON public.embeddings_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings"
  ON public.embeddings_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings"
  ON public.embeddings_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Create admin-only policies for system tables

-- entities: authenticated users read, admins write
CREATE POLICY "Authenticated users can view entities"
  ON public.entities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert entities"
  ON public.entities FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- relationships: authenticated users read, admins write
CREATE POLICY "Authenticated users can view relationships"
  ON public.relationships FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert relationships"
  ON public.relationships FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ontologies: authenticated users read, admins write
CREATE POLICY "Authenticated users can view ontologies"
  ON public.ontologies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert ontologies"
  ON public.ontologies FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- agent_metadata: admins only
CREATE POLICY "Admins can view agent metadata"
  ON public.agent_metadata FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert agent metadata"
  ON public.agent_metadata FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update agent metadata"
  ON public.agent_metadata FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- confidence_scores: admins only
CREATE POLICY "Admins can view confidence scores"
  ON public.confidence_scores FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert confidence scores"
  ON public.confidence_scores FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- system_logs: admins only
CREATE POLICY "Admins can view system logs"
  ON public.system_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Assign 'user' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Create indexes for performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_query_cache_user_id ON public.query_cache(user_id);
CREATE INDEX idx_embeddings_cache_user_id ON public.embeddings_cache(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Migration complete