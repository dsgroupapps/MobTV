-- Drop the existing insert policy for orders
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Create new insert policy that allows users to create their own orders
-- AND allows admins to create orders for any user
CREATE POLICY "Users and admins can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);