-- Fix 1: Remove public access to orders table (user_id exposure)
DROP POLICY IF EXISTS "Public can view paid orders" ON orders;

-- Fix 2: Restrict slot_locks to prevent manipulation
DROP POLICY IF EXISTS "System can manage slot locks" ON slot_locks;

-- Admin and service role can manage all slot locks
CREATE POLICY "Admins can manage slot locks" ON slot_locks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can only view their own quote locks
CREATE POLICY "Users can view their quote locks" ON slot_locks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = slot_locks.quote_id
    AND q.user_id = auth.uid()
  )
);

-- Fix 3: Make assets storage bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'assets';