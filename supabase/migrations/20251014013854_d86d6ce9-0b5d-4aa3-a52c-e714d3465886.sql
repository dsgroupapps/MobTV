-- Tornar o bucket 'assets' público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'assets';

-- Adicionar policy para permitir download público dos assets
CREATE POLICY "Anyone can download approved assets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 
    FROM assets a
    INNER JOIN order_items oi ON a.order_item_id = oi.id
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE a.storage_url LIKE '%' || storage.objects.name || '%'
    AND a.status = 'approved'
    AND o.status = 'paid'
  )
);