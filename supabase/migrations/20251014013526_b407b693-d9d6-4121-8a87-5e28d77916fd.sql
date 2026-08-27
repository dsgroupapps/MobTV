-- Permitir acesso público aos order_items de orders pagas
CREATE POLICY "Anyone can view order items from paid orders"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM orders o
    WHERE o.id = order_items.order_id
    AND o.status = 'paid'
  )
);

-- Permitir acesso público aos orders com status 'paid'
CREATE POLICY "Anyone can view paid orders"
ON public.orders
FOR SELECT
USING (status = 'paid');