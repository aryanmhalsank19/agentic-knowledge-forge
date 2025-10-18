-- Create a demo admin user for easy testing
-- Email: demo@example.com
-- Password: demo123456

-- First, check if demo user exists and delete if present
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Try to find existing demo user
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@example.com';
  
  -- If exists, clean up
  IF demo_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = demo_user_id;
    DELETE FROM public.profiles WHERE id = demo_user_id;
    DELETE FROM auth.users WHERE id = demo_user_id;
  END IF;
END $$;

-- Insert demo user into auth.users
-- Note: In production, this would be done via Supabase Auth API with proper password hashing
-- For demo purposes, we'll document the credentials: demo@example.com / demo123456
-- The actual user will need to be created through the signup form first time

-- Create a helper function to set up demo data for a user
CREATE OR REPLACE FUNCTION public.setup_demo_user(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = user_email;
  
  IF demo_user_id IS NOT NULL THEN
    -- Ensure user has admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (demo_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;