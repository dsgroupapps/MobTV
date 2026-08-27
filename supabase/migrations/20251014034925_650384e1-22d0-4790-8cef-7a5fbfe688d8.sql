-- Drop the existing insert policy for order_items
DROP POLICY IF EXISTS "System can create order items" ON public.order_items;

-- Create new insert policy that allows users to create items for their orders
-- AND allows admins to create order items for any order
CREATE POLICY "Users and admins can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);