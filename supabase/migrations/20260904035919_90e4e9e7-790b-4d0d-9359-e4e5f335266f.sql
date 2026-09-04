CREATE OR REPLACE FUNCTION public.get_top_customers(p_limit integer DEFAULT 10)
RETURNS TABLE(customer_id uuid, name text, total_spent numeric, total_transactions bigint, total_orders bigint, total_points integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.get_user_role(auth.uid()) IS NULL
     OR public.get_user_role(auth.uid()) = 'buyer'::public.user_role THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH tx AS (
    SELECT t.customer_id AS cid, COALESCE(SUM(t.total_amount),0) AS spent, COUNT(*) AS cnt
    FROM public.transactions t
    WHERE t.customer_id IS NOT NULL
    GROUP BY t.customer_id
    ORDER BY COALESCE(SUM(t.total_amount),0) DESC
    LIMIT GREATEST(COALESCE(p_limit,10), 1)
  ),
  ord AS (
    SELECT o.customer_id AS cid, COUNT(*) AS cnt
    FROM public.orders o
    WHERE o.customer_id IN (SELECT cid FROM tx)
    GROUP BY o.customer_id
  )
  SELECT c.id,
         c.name,
         tx.spent::numeric,
         tx.cnt::bigint,
         COALESCE(ord.cnt,0)::bigint,
         COALESCE(c.total_points,0)::integer
  FROM tx
  JOIN public.customers c ON c.id = tx.cid
  LEFT JOIN ord ON ord.cid = tx.cid
  ORDER BY tx.spent DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_top_customers(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_customers(integer) TO authenticated;