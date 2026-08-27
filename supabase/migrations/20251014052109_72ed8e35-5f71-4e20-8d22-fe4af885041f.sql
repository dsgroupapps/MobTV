-- Fix RLS policies for assets table to allow admin uploads
DROP POLICY IF EXISTS "Users can upload assets for their orders" ON public.assets;
DROP POLICY IF EXISTS "Users can update their pending assets" ON public.assets;

-- Allow admins to create assets for any user
CREATE POLICY "Admins can create assets for users"
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow users to create assets for their own orders
CREATE POLICY "Users can create assets for own orders"
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Allow users and admins to update their pending assets
CREATE POLICY "Users can update own pending assets"
ON public.assets
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'pending')
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);