-- 1. Canonical per-customer summary: transactions = financial truth, orders = fulfillment count
DROP FUNCTION IF EXISTS public.get_customer_summaries(uuid[]);
CREATE FUNCTION public.get_customer_summaries(p_customer_ids uuid[])
RETURNS TABLE(customer_id uuid, total_spent numeric, total_transactions bigint, total_orders bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_staff boolean := public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role,'cashier'::public.user_role]);
BEGIN
  IF NOT v_is_staff THEN
    -- buyers may only read summaries for their own customer record
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
  SELECT ids.id, COALESCE(tx.spent,0)::numeric, COALESCE(tx.cnt,0)::bigint, COALESCE(ord.cnt,0)::bigint
  FROM ids
  LEFT JOIN tx ON tx.cid = ids.id
  LEFT JOIN ord ON ord.cid = ids.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_summaries(uuid[]) TO authenticated, service_role;

-- 2. Global customer statistics (database aggregation, staff only)
DROP FUNCTION IF EXISTS public.get_customer_statistics();
CREATE FUNCTION public.get_customer_statistics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF public.get_user_role(auth.uid()) IS NULL
     OR public.get_user_role(auth.uid()) = 'buyer'::public.user_role THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'total_customers', (SELECT COUNT(*) FROM public.customers),
    'active_customers_this_month', (SELECT COUNT(*) FROM public.customers WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    'total_points', (SELECT COALESCE(SUM(total_points),0) FROM public.customers),
    'total_spent', (SELECT COALESCE(SUM(total_amount),0) FROM public.transactions WHERE customer_id IS NOT NULL),
    'total_transactions', (SELECT COUNT(*) FROM public.transactions WHERE customer_id IS NOT NULL),
    'total_orders', (SELECT COUNT(*) FROM public.orders WHERE customer_id IS NOT NULL)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_statistics() TO authenticated, service_role;

-- 3. Read-only duplicate detection (no data deletion)
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
  SELECT t.order_id, MIN(t.customer_id), COUNT(*), array_agg(t.id), array_agg(t.total_amount)
  FROM public.transactions t
  WHERE t.order_id IS NOT NULL
  GROUP BY t.order_id
  HAVING COUNT(*) > 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_duplicate_order_transactions() TO authenticated, service_role;

-- 4. Security: restrict internal supplier/purchase/return data to staff roles
DROP POLICY IF EXISTS "Everyone can view suppliers" ON public.suppliers;
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role,'cashier'::public.user_role]));

DROP POLICY IF EXISTS "Everyone can view purchases" ON public.purchases;
CREATE POLICY "Staff can view purchases" ON public.purchases FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role]));

DROP POLICY IF EXISTS "Everyone can view purchase items" ON public.purchase_items;
CREATE POLICY "Staff can view purchase items" ON public.purchase_items FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role]));

DROP POLICY IF EXISTS "Everyone can view purchase payments" ON public.purchase_payments;
CREATE POLICY "Staff can view purchase payments" ON public.purchase_payments FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role]));

DROP POLICY IF EXISTS "Everyone can view returns" ON public.returns;
CREATE POLICY "Staff can view returns" ON public.returns FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role]));

DROP POLICY IF EXISTS "Everyone can view return items" ON public.return_items;
CREATE POLICY "Staff can view return items" ON public.return_items FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role]));