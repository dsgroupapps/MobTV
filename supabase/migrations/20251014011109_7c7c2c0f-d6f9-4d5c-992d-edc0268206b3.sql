-- Add RLS policies for quote_items
CREATE POLICY "Users can create items for their quotes"
ON public.quote_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.user_id = auth.uid()
  )
);

-- Add RLS policies for order_items
CREATE POLICY "System can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Add RLS policy for reservations
CREATE POLICY "System can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = reservations.order_id
    AND orders.user_id = auth.uid()
  )
);