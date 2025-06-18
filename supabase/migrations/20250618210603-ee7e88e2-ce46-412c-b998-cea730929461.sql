
-- Insert profiles for existing users who don't have a profile yet
INSERT INTO public.profiles (id, name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'name', 'משתמש ' || LEFT(au.id::text, 8)) as name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
