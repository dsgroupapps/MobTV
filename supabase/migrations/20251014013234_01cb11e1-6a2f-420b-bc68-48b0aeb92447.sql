-- Permitir acesso público aos assets aprovados com orders pagas
CREATE POLICY "Anyone can view approved assets with paid orders"
ON public.assets
FOR SELECT
USING (
  status = 'approved' 
  AND EXISTS (
    SELECT 1 
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE oi.id = assets.order_item_id
    AND o.status = 'paid'
  )
);