CREATE OR REPLACE FUNCTION public.get_duplicate_order_transactions()
RETURNS TABLE(order_id uuid, customer_id uuid, transaction_count bigint, transaction_ids uuid[], total_amounts numeric[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.get_user_role(auth.uid()) <> ALL (ARRAY['admin'::public.user_role,'manager'::public.user_role]) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT t.order_id,
         (array_agg(t.customer_id))[1],
         COUNT(*),
         array_agg(t.id),
         array_agg(t.total_amount)
  FROM public.transactions t
  WHERE t.order_id IS NOT NULL
  GROUP BY t.order_id
  HAVING COUNT(*) > 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_duplicate_order_transactions() TO authenticated, service_role;