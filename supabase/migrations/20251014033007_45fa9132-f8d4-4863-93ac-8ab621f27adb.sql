-- Allow public access to panel player data
-- Players need to read panel info, approved assets, and filler media without authentication

-- Drop restrictive policies for public player access
DROP POLICY IF EXISTS "Anyone can view active panels" ON public.panels;
DROP POLICY IF EXISTS "Anyone can view approved assets with paid orders" ON public.assets;
DROP POLICY IF EXISTS "Anyone can view active filler media" ON public.filler_media;
DROP POLICY IF EXISTS "Anyone can view order items from paid orders" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view paid orders" ON public.orders;

-- Create new public access policies for panels
CREATE POLICY "Public can view all panels"
ON public.panels
FOR SELECT
USING (true);

-- Create new public access policies for approved assets with paid orders
CREATE POLICY "Public can view approved assets with paid orders"
ON public.assets
FOR SELECT
USING (
  status = 'approved' AND
  EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.id = assets.order_item_id
    AND o.status = 'paid'
  )
);

-- Create new public access policy for filler media
CREATE POLICY "Public can view active filler media"
ON public.filler_media
FOR SELECT
USING (active = true);

-- Create new public access policy for order items from paid orders
CREATE POLICY "Public can view order items from paid orders"
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

-- Create new public access policy for paid orders
CREATE POLICY "Public can view paid orders"
ON public.orders
FOR SELECT
USING (status = 'paid');