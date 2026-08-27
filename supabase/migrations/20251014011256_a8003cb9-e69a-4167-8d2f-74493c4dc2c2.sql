-- Fix quotes UPDATE policy to allow status changes
DROP POLICY IF EXISTS "Users can update their own pending quotes" ON public.quotes;

CREATE POLICY "Users can update their own pending quotes"
ON public.quotes
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending'::quote_status)
WITH CHECK (auth.uid() = user_id);