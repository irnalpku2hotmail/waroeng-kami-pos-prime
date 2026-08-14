-- =========================================================
-- 1. SECURITY FIXES: restrict overly broad SELECT policies
-- =========================================================

-- credit_payments: only staff, or the customer who owns the underlying transaction
DROP POLICY IF EXISTS "Everyone can view credit payments" ON public.credit_payments;
CREATE POLICY "Staff or owning customer can view credit payments"
ON public.credit_payments
FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
  OR EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = credit_payments.transaction_id
      AND public.customer_owns_transaction(t.customer_id)
  )
);

-- customer_returns: only staff, or the owning customer
DROP POLICY IF EXISTS "Everyone can view customer returns" ON public.customer_returns;
CREATE POLICY "Staff or owning customer can view customer returns"
ON public.customer_returns
FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
  OR public.customer_owns_transaction(customer_id)
);

-- expenses: staff/admin only
DROP POLICY IF EXISTS "Everyone can view expenses" ON public.expenses;
CREATE POLICY "Staff can view expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role])
);

-- =========================================================
-- 2. HELPER: staff-only guard for reporting RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.get_user_role(auth.uid())::text, '') IN ('admin','manager','staff','cashier');
$$;

GRANT EXECUTE ON FUNCTION public.is_staff_user() TO authenticated;

-- =========================================================
-- 3. SERVER-SIDE AGGREGATION RPCs (replace client fetch-all)
-- =========================================================

-- 3a. Admin notifications: filtered, sorted and paginated in the database
CREATE OR REPLACE FUNCTION public.get_admin_notifications(
  p_priority text DEFAULT 'all',
  p_type text DEFAULT 'all',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id text,
  type text,
  title text,
  message text,
  event_time timestamptz,
  priority text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_user() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH items AS (
    SELECT 'low-stock-' || p.id::text AS n_id,
           'low_stock'::text AS n_type,
           'Stok Rendah'::text AS n_title,
           p.name || ' tersisa ' || p.current_stock || ' unit (minimum: ' || p.min_stock || ')' AS n_message,
           now() AS n_time,
           'high'::text AS n_priority
    FROM products p
    WHERE p.is_active AND p.current_stock <= p.min_stock
    UNION ALL
    SELECT 'overdue-credit-' || t.id::text,
           'overdue_payment',
           'Piutang Terlambat',
           coalesce(c.name, 'Customer') || ' - Rp ' || to_char(t.total_amount, 'FM999,999,999,999'),
           t.due_date::timestamptz,
           'urgent'
    FROM transactions t
    LEFT JOIN customers c ON c.id = t.customer_id
    WHERE t.is_credit AND t.due_date < current_date AND t.total_amount > t.paid_amount
    UNION ALL
    SELECT 'overdue-purchase-' || pu.id::text,
           'overdue_purchase',
           'Hutang Terlambat',
           coalesce(s.name, 'Supplier') || ' - ' || pu.purchase_number || ' - Rp ' || to_char(pu.total_amount, 'FM999,999,999,999'),
           pu.due_date::timestamptz,
           'urgent'
    FROM purchases pu
    LEFT JOIN suppliers s ON s.id = pu.supplier_id
    WHERE pu.payment_method = 'credit'
      AND coalesce(pu.payment_status, '') <> 'paid'
      AND pu.due_date < current_date
    UNION ALL
    SELECT 'pending-order-' || o.id::text,
           'pending_order',
           'Pesanan Baru',
           o.customer_name || ' - ' || o.order_number,
           o.created_at,
           'medium'
    FROM orders o
    WHERE o.status = 'pending'
    UNION ALL
    SELECT 'pending-return-' || r.id::text,
           'pending_return',
           'Return Menunggu Proses',
           coalesce(s.name, 'Supplier') || ' - ' || r.return_number,
           r.created_at,
           'medium'
    FROM returns r
    LEFT JOIN suppliers s ON s.id = r.supplier_id
    WHERE r.status = 'process'
  ),
  filtered AS (
    SELECT * FROM items i
    WHERE (p_priority = 'all' OR i.n_priority = p_priority)
      AND (p_type = 'all' OR i.n_type = p_type)
  )
  SELECT f.n_id, f.n_type, f.n_title, f.n_message, f.n_time, f.n_priority,
         (SELECT count(*) FROM filtered)
  FROM filtered f
  ORDER BY CASE f.n_priority WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC,
           f.n_time DESC
  LIMIT greatest(p_limit, 1) OFFSET greatest(p_offset, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_notifications(text, text, int, int) TO authenticated;

-- 3b. Search analytics summary
CREATE OR REPLACE FUNCTION public.get_search_analytics_summary(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff timestamptz := now() - (greatest(p_days, 1) || ' days')::interval;
  v_result jsonb;
BEGIN
  IF NOT public.is_staff_user() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'total_searches', (SELECT count(*) FROM search_analytics WHERE created_at >= v_cutoff),
    'unique_searches', (SELECT count(DISTINCT lower(btrim(search_query))) FROM search_analytics WHERE created_at >= v_cutoff),
    'no_results_count', (SELECT count(*) FROM search_analytics WHERE created_at >= v_cutoff AND results_count = 0),
    'top_searches', coalesce((
      SELECT jsonb_agg(jsonb_build_object('query', q, 'count', c))
      FROM (
        SELECT lower(btrim(search_query)) AS q, count(*) AS c
        FROM search_analytics
        WHERE created_at >= v_cutoff
        GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10
      ) top
    ), '[]'::jsonb),
    'no_result_searches', coalesce((
      SELECT jsonb_agg(jsonb_build_object('query', q, 'count', c))
      FROM (
        SELECT lower(btrim(search_query)) AS q, count(*) AS c
        FROM search_analytics
        WHERE created_at >= v_cutoff AND results_count = 0
        GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10
      ) nores
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_search_analytics_summary(int) TO authenticated;

-- 3c. Audit report summary
CREATE OR REPLACE FUNCTION public.get_audit_summary(p_from timestamptz, p_to timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_staff_user() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'tx_count', (SELECT count(*) FROM transactions WHERE created_at BETWEEN p_from AND p_to),
    'tx_revenue', (SELECT coalesce(sum(total_amount), 0) FROM transactions WHERE created_at BETWEEN p_from AND p_to),
    'pos_count', (SELECT count(*) FROM transactions WHERE created_at BETWEEN p_from AND p_to AND coalesce(source, 'POS') <> 'FRONTEND_ORDER'),
    'order_count', (SELECT count(*) FROM transactions WHERE created_at BETWEEN p_from AND p_to AND source = 'FRONTEND_ORDER'),
    'items_count', (SELECT count(*) FROM transaction_items WHERE created_at BETWEEN p_from AND p_to),
    'points_sum', (SELECT coalesce(sum(points_change), 0) FROM point_transactions WHERE created_at BETWEEN p_from AND p_to),
    'points_entries', (SELECT count(*) FROM point_transactions WHERE created_at BETWEEN p_from AND p_to),
    'duplicates', coalesce((
      SELECT jsonb_agg(jsonb_build_object('order_id', order_id, 'count', c))
      FROM (
        SELECT order_id, count(*) AS c
        FROM transactions
        WHERE order_id IS NOT NULL AND created_at BETWEEN p_from AND p_to
        GROUP BY order_id HAVING count(*) > 1
        ORDER BY 2 DESC LIMIT 50
      ) d
    ), '[]'::jsonb),
    'stock_variance', coalesce((
      SELECT jsonb_agg(jsonb_build_object('product_id', product_id, 'net', net))
      FROM (
        SELECT product_id, sum(quantity) AS net
        FROM stock_movements
        WHERE created_at BETWEEN p_from AND p_to
        GROUP BY product_id
        ORDER BY abs(sum(quantity)) DESC LIMIT 15
      ) sv
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_audit_summary(timestamptz, timestamptz) TO authenticated;

-- 3d. Dashboard summary (single round-trip for all stat cards)
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz := date_trunc('day', now());
  v_end timestamptz := date_trunc('day', now()) + interval '1 day' - interval '1 millisecond';
  v_result jsonb;
BEGIN
  IF NOT public.is_staff_user() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'total_products', (SELECT count(*) FROM products),
    'low_stock', (SELECT count(*) FROM products WHERE current_stock < 10),
    'expired_products', (SELECT count(DISTINCT product_id) FROM purchase_items WHERE expiration_date IS NOT NULL AND expiration_date < current_date),
    'total_customers', (SELECT count(*) FROM customers),
    'today_orders', (SELECT count(*) FROM orders WHERE created_at BETWEEN v_start AND v_end),
    'today_pos_total', (SELECT coalesce(sum(total_amount), 0) FROM transactions WHERE created_at BETWEEN v_start AND v_end),
    'today_pos_count', (SELECT count(*) FROM transactions WHERE created_at BETWEEN v_start AND v_end),
    'today_cod_total', (SELECT coalesce(sum(total_amount), 0) FROM orders WHERE status = 'delivered' AND delivery_date BETWEEN v_start AND v_end)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated;

-- =========================================================
-- 4. SUPPORTING INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON public.products (is_active, current_stock);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_items_created_at ON public.transaction_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON public.search_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_expiration ON public.purchase_items (expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_created_at ON public.bundles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rrr_status_requested_at ON public.reward_redemption_requests (status, requested_at DESC);