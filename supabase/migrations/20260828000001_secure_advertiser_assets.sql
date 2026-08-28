-- Keep advertiser uploads bound to order items owned by the same user.
DROP POLICY IF EXISTS "Users can create assets for own orders" ON public.assets;

CREATE POLICY "Users can create assets for own orders"
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND order_item_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.order_items AS item
    INNER JOIN public.orders AS customer_order ON customer_order.id = item.order_id
    WHERE item.id = assets.order_item_id
      AND customer_order.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own pending assets" ON public.assets;

CREATE POLICY "Users can update own pending assets"
ON public.assets
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'pending'::public.asset_status)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  (
    auth.uid() = user_id
    AND status = 'pending'::public.asset_status
    AND order_item_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.order_items AS item
      INNER JOIN public.orders AS customer_order ON customer_order.id = item.order_id
      WHERE item.id = assets.order_item_id
        AND customer_order.user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- This legacy policy grants anonymous reads to every object despite its name.
-- The narrower "Anyone can download approved assets" policy remains in place.
DROP POLICY IF EXISTS "Players can view approved assets" ON storage.objects;

UPDATE storage.buckets
SET public = false
WHERE id = 'assets';
