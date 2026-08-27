-- Update the handle_new_user function to assign roles based on email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign role based on email
  IF NEW.email = 'paulosouza17@gmail.com' THEN
    -- Admin role for specific email
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Default advertiser role for everyone else
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'advertiser');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure paulosouza17@gmail.com has admin role if the user already exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the user ID for paulosouza17@gmail.com from profiles/user_roles
  SELECT user_id INTO admin_user_id
  FROM public.user_roles
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'paulosouza17@gmail.com'
  )
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Remove any existing roles for this user
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin');
  END IF;
END $$;