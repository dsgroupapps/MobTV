-- Admin-only operations required by the legacy campaign management flow.
-- Both functions constrain the writable fields instead of granting broad table UPDATE/INSERT policies.
CREATE OR REPLACE FUNCTION public.admin_reschedule_order_item(
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
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.order_items AS item
  SET
    date = p_date,
    start_time = p_start_time
  FROM public.orders AS customer_order
  WHERE item.id = p_order_item_id
    AND customer_order.id = item.order_id
    AND customer_order.status = 'paid'::public.order_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paid order item not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reschedule_order_item(uuid, date, time without time zone)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_reschedule_order_item(uuid, date, time without time zone)
TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_campaign_for_user(
  p_user_id uuid,
  p_type public.quote_type,
  p_date_start date,
  p_date_end date,
  p_duration_seconds integer,
  p_total_insertions integer,
  p_total_price numeric,
  p_expires_at timestamp with time zone,
  p_items jsonb
)
RETURNS TABLE (quote_id uuid, order_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_quote_id uuid;
  created_order_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_date_end < p_date_start OR p_duration_seconds <= 0 OR p_total_price < 0 THEN
    RAISE EXCEPTION 'Invalid campaign configuration' USING ERRCODE = '22023';
  END IF;

  IF p_type = 'campaign'::public.quote_type
    AND (p_total_insertions IS NULL OR p_total_insertions <= 0) THEN
    RAISE EXCEPTION 'Campaign requires total insertions' USING ERRCODE = '22023';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Campaign requires at least one item' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS item(
      panel_id uuid,
      date date,
      start_time time without time zone,
      duration_seconds integer,
      unit_price numeric,
      final_price numeric
    )
    LEFT JOIN public.panels AS panel ON panel.id = item.panel_id
    WHERE item.panel_id IS NULL
      OR item.date IS NULL
      OR item.start_time IS NULL
      OR item.duration_seconds IS NULL
      OR item.unit_price IS NULL
      OR item.final_price IS NULL
      OR panel.id IS NULL
      OR panel.active = false
      OR item.date < p_date_start
      OR item.date > p_date_end
      OR item.duration_seconds <> p_duration_seconds
      OR item.unit_price < 0
      OR item.final_price < 0
  ) THEN
    RAISE EXCEPTION 'Campaign contains an invalid item' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.quotes (
    user_id,
    type,
    date_start,
    date_end,
    duration_seconds,
    total_insertions,
    status,
    total_price,
    expires_at
  )
  VALUES (
    p_user_id,
    p_type,
    p_date_start,
    p_date_end,
    p_duration_seconds,
    p_total_insertions,
    'accepted'::public.quote_status,
    p_total_price,
    p_expires_at
  )
  RETURNING id INTO created_quote_id;

  INSERT INTO public.quote_items (
    quote_id,
    panel_id,
    date,
    start_time,
    duration_seconds,
    unit_price,
    final_price
  )
  SELECT
    created_quote_id,
    item.panel_id,
    item.date,
    item.start_time,
    item.duration_seconds,
    item.unit_price,
    item.final_price
  FROM jsonb_to_recordset(p_items) AS item(
    panel_id uuid,
    date date,
    start_time time without time zone,
    duration_seconds integer,
    unit_price numeric,
    final_price numeric
  );

  INSERT INTO public.orders (user_id, quote_id, status, total_amount, paid_at)
  VALUES (
    p_user_id,
    created_quote_id,
    'paid'::public.order_status,
    p_total_price,
    now()
  )
  RETURNING id INTO created_order_id;

  INSERT INTO public.order_items (
    order_id,
    panel_id,
    date,
    start_time,
    duration_seconds,
    unit_price,
    final_price
  )
  SELECT
    created_order_id,
    item.panel_id,
    item.date,
    item.start_time,
    item.duration_seconds,
    item.unit_price,
    item.final_price
  FROM jsonb_to_recordset(p_items) AS item(
    panel_id uuid,
    date date,
    start_time time without time zone,
    duration_seconds integer,
    unit_price numeric,
    final_price numeric
  );

  RETURN QUERY SELECT created_quote_id, created_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_campaign_for_user(
  uuid,
  public.quote_type,
  date,
  date,
  integer,
  integer,
  numeric,
  timestamp with time zone,
  jsonb
)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_create_campaign_for_user(
  uuid,
  public.quote_type,
  date,
  date,
  integer,
  integer,
  numeric,
  timestamp with time zone,
  jsonb
)
TO authenticated;
