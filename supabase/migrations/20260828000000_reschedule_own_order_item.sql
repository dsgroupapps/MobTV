-- Restrict advertiser rescheduling to the two fields exposed by the legacy calendar.
-- A broad UPDATE policy on order_items would also allow changing panel and pricing data.
CREATE OR REPLACE FUNCTION public.reschedule_own_order_item(
  p_order_item_id uuid,
  p_date date,
  p_start_time time without time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.order_items AS item
  SET
    date = p_date,
    start_time = p_start_time
  FROM public.orders AS customer_order
  WHERE item.id = p_order_item_id
    AND customer_order.id = item.order_id
    AND customer_order.user_id = auth.uid()
    AND customer_order.status = 'paid'::public.order_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item not found or not available for rescheduling'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reschedule_own_order_item(uuid, date, time without time zone)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reschedule_own_order_item(uuid, date, time without time zone)
TO authenticated;
