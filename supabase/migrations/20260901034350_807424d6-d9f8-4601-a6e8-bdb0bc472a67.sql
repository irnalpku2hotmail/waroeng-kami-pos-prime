CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

DROP FUNCTION IF EXISTS public.get_customer_summaries(uuid[]);
CREATE OR REPLACE FUNCTION public.get_customer_summaries(p_customer_ids uuid[])
RETURNS TABLE(customer_id uuid, total_spent numeric, total_transactions bigint, total_orders bigint, total_points integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_staff boolean := public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role,'cashier'::public.user_role]);
BEGIN
  IF NOT v_is_staff THEN
    IF EXISTS (
      SELECT 1 FROM unnest(COALESCE(p_customer_ids, ARRAY[]::uuid[])) AS id
      WHERE id NOT IN (SELECT c.id FROM public.customers c WHERE c.profile_id = auth.uid())
    ) THEN
      RAISE EXCEPTION 'not authorized';
    END IF;
  END IF;

  RETURN QUERY
  WITH ids AS (
    SELECT DISTINCT unnest(COALESCE(p_customer_ids, ARRAY[]::uuid[])) AS id
  ),
  tx AS (
    SELECT t.customer_id AS cid, COALESCE(SUM(t.total_amount),0) AS spent, COUNT(*) AS cnt
    FROM public.transactions t
    WHERE t.customer_id IN (SELECT id FROM ids)
    GROUP BY t.customer_id
  ),
  ord AS (
    SELECT o.customer_id AS cid, COUNT(*) AS cnt
    FROM public.orders o
    WHERE o.customer_id IN (SELECT id FROM ids)
    GROUP BY o.customer_id
  )
  SELECT ids.id,
         COALESCE(tx.spent,0)::numeric,
         COALESCE(tx.cnt,0)::bigint,
         COALESCE(ord.cnt,0)::bigint,
         COALESCE(c.total_points,0)::integer
  FROM ids
  LEFT JOIN tx ON tx.cid = ids.id
  LEFT JOIN ord ON ord.cid = ids.id
  LEFT JOIN public.customers c ON c.id = ids.id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_customer_summaries(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_customer_transactions(
  p_customer_id uuid,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_year integer DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  transaction_number text,
  total_amount numeric,
  points_earned integer,
  points_used integer,
  created_at timestamptz,
  order_id uuid,
  source text,
  item_count bigint,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_staff boolean := public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role,'cashier'::public.user_role]);
  v_size integer := GREATEST(1, LEAST(COALESCE(p_page_size,10), 100));
  v_offset integer := GREATEST(0, (COALESCE(p_page,1) - 1) * v_size);
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF NOT v_is_staff THEN
    IF NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = p_customer_id AND c.profile_id = auth.uid()) THEN
      RAISE EXCEPTION 'not authorized';
    END IF;
  END IF;

  IF p_year IS NOT NULL THEN
    v_start := make_timestamptz(p_year, 1, 1, 0, 0, 0);
    v_end := make_timestamptz(p_year + 1, 1, 1, 0, 0, 0);
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT t.id, t.transaction_number, t.total_amount, t.points_earned, t.points_used,
           t.created_at, t.order_id, t.source
    FROM public.transactions t
    WHERE t.customer_id = p_customer_id
      AND (v_start IS NULL OR (t.created_at >= v_start AND t.created_at < v_end))
  ),
  total AS (SELECT COUNT(*) AS c FROM filtered),
  page AS (
    SELECT * FROM filtered ORDER BY created_at DESC LIMIT v_size OFFSET v_offset
  )
  SELECT p.id, p.transaction_number, p.total_amount, p.points_earned, p.points_used,
         p.created_at, p.order_id, p.source,
         COALESCE((SELECT COUNT(*) FROM public.transaction_items ti WHERE ti.transaction_id = p.id), 0)::bigint,
         (SELECT c FROM total)::bigint
  FROM page p
  ORDER BY p.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_customer_transactions(uuid, integer, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_customer_transaction_years(p_customer_id uuid)
RETURNS TABLE(year integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_staff boolean := public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role,'cashier'::public.user_role]);
BEGIN
  IF NOT v_is_staff THEN
    IF NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = p_customer_id AND c.profile_id = auth.uid()) THEN
      RAISE EXCEPTION 'not authorized';
    END IF;
  END IF;

  RETURN QUERY
  SELECT DISTINCT EXTRACT(YEAR FROM t.created_at)::integer AS year
  FROM public.transactions t
  WHERE t.customer_id = p_customer_id
  ORDER BY 1 DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_customer_transaction_years(uuid) TO authenticated;
