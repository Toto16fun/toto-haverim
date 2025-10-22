-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
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

-- RLS policies for user_roles table
-- Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can view roles
CREATE POLICY "All authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Insert roles for the three admin users
-- תומר כהן (tomercohen1995@gmail.com)
INSERT INTO public.user_roles (user_id, role) VALUES 
('e1caa9ff-abf6-49ad-bdad-297558ab8ca7', 'admin');

-- דניאל גולדברג (dg28395@gmail.com)
INSERT INTO public.user_roles (user_id, role) VALUES 
('5d74d725-599f-44c3-ba35-9b5c629fdb7e', 'admin');

-- אורי לרנר (ori541995@walla.co.il)
INSERT INTO public.user_roles (user_id, role) VALUES 
('97a02f21-1d02-43c8-8af3-d80ddc17cb7a', 'admin');