
-- ============================================================
-- AUDIT FIX: Re-attach missing triggers, add stock_movements
-- ledger, add loyalty automation for frontend orders, and
-- backfill customer aggregates from historical data.
-- POS loyalty already handled in code (usePOS) — no trigger.
-- ============================================================

-- ---------- A. Re-attach existing trigger functions ----------

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

DROP TRIGGER IF EXISTS trg_set_credit_due_date ON public.purchases;
CREATE TRIGGER trg_set_credit_due_date BEFORE INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.set_credit_due_date();

DROP TRIGGER IF EXISTS trg_set_customer_return_number ON public.customer_returns;
CREATE TRIGGER trg_set_customer_return_number BEFORE INSERT ON public.customer_returns
FOR EACH ROW EXECUTE FUNCTION public.set_customer_return_number();

DROP TRIGGER IF EXISTS trg_handle_product_price_change ON public.products;
CREATE TRIGGER trg_handle_product_price_change
AFTER UPDATE OF selling_price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_product_price_change();

-- Stock movement triggers
DROP TRIGGER IF EXISTS trg_update_stock_on_sale ON public.transaction_items;
CREATE TRIGGER trg_update_stock_on_sale
AFTER INSERT OR UPDATE OR DELETE ON public.transaction_items
FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_sale();

DROP TRIGGER IF EXISTS trg_update_stock_on_purchase ON public.purchase_items;
CREATE TRIGGER trg_update_stock_on_purchase
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_purchase();

DROP TRIGGER IF EXISTS trg_update_stock_on_order_delivery ON public.orders;
CREATE TRIGGER trg_update_stock_on_order_delivery
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_order_delivery();

DROP TRIGGER IF EXISTS trg_update_stock_on_return_status_change ON public.returns;
CREATE TRIGGER trg_update_stock_on_return_status_change
AFTER INSERT OR UPDATE OR DELETE ON public.returns
FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_return_status_change();

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON public.%I;', t);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
  END LOOP;
END $$;

-- ---------- B. Customer return → restore stock ----------
CREATE OR REPLACE FUNCTION public.restore_stock_on_customer_return()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status IN ('approved','completed','success') AND OLD.status NOT IN ('approved','completed','success') THEN
      UPDATE public.products p SET current_stock = current_stock + cri.quantity
      FROM public.customer_return_items cri
      WHERE cri.customer_return_id = NEW.id AND p.id = cri.product_id;
    ELSIF OLD.status IN ('approved','completed','success') AND NEW.status NOT IN ('approved','completed','success') THEN
      UPDATE public.products p SET current_stock = current_stock - cri.quantity
      FROM public.customer_return_items cri
      WHERE cri.customer_return_id = NEW.id AND p.id = cri.product_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_restore_stock_on_customer_return ON public.customer_returns;
CREATE TRIGGER trg_restore_stock_on_customer_return
AFTER UPDATE ON public.customer_returns
FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_customer_return();

-- ---------- C. Stock movements ledger ----------
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN
    ('PURCHASE_IN','SALE_OUT','ONLINE_ORDER_OUT','ONLINE_ORDER_IN','RETURN_IN','SUPPLIER_RETURN_OUT','ADJUSTMENT','REWARD_OUT')),
  quantity numeric NOT NULL,
  reference_table text,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON public.stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_ref_idx ON public.stock_movements(reference_table, reference_id);

GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view stock movements" ON public.stock_movements;
CREATE POLICY "Staff can view stock movements" ON public.stock_movements FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
          AND p.role::text IN ('admin','manager','staff','cashier'))
);

DROP POLICY IF EXISTS "System can insert stock movements" ON public.stock_movements;
CREATE POLICY "System can insert stock movements" ON public.stock_movements FOR INSERT
TO authenticated WITH CHECK (true);

-- Helper to record movements
CREATE OR REPLACE FUNCTION public.log_stock_movement(
  p_product_id uuid, p_type text, p_qty numeric,
  p_ref_table text, p_ref_id uuid, p_notes text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_by)
  VALUES (p_product_id, p_type, p_qty, p_ref_table, p_ref_id, p_notes, auth.uid());
END $$;

-- Ledger triggers
CREATE OR REPLACE FUNCTION public.log_movement_transaction_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    PERFORM log_stock_movement(NEW.product_id,'SALE_OUT',-NEW.quantity,'transaction_items',NEW.id,'POS sale');
  ELSIF TG_OP='DELETE' THEN
    PERFORM log_stock_movement(OLD.product_id,'SALE_OUT',OLD.quantity,'transaction_items',OLD.id,'POS sale reversed');
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS trg_log_mov_txn_items ON public.transaction_items;
CREATE TRIGGER trg_log_mov_txn_items AFTER INSERT OR DELETE ON public.transaction_items
FOR EACH ROW EXECUTE FUNCTION public.log_movement_transaction_items();

CREATE OR REPLACE FUNCTION public.log_movement_purchase_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    PERFORM log_stock_movement(NEW.product_id,'PURCHASE_IN',NEW.quantity,'purchase_items',NEW.id,'Purchase received');
  ELSIF TG_OP='DELETE' THEN
    PERFORM log_stock_movement(OLD.product_id,'PURCHASE_IN',-OLD.quantity,'purchase_items',OLD.id,'Purchase reversed');
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS trg_log_mov_purchase_items ON public.purchase_items;
CREATE TRIGGER trg_log_mov_purchase_items AFTER INSERT OR DELETE ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.log_movement_purchase_items();

CREATE OR REPLACE FUNCTION public.log_movement_order_delivered()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='delivered' AND (OLD.status IS NULL OR OLD.status<>'delivered') THEN
    INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_by)
    SELECT oi.product_id,'ONLINE_ORDER_OUT', -oi.quantity, 'orders', NEW.id, 'Order '||NEW.order_number||' delivered', auth.uid()
    FROM public.order_items oi WHERE oi.order_id = NEW.id;
  ELSIF OLD.status='delivered' AND NEW.status<>'delivered' THEN
    INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_by)
    SELECT oi.product_id,'ONLINE_ORDER_IN', oi.quantity, 'orders', NEW.id, 'Order '||NEW.order_number||' undelivered', auth.uid()
    FROM public.order_items oi WHERE oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_log_mov_order_delivered ON public.orders;
CREATE TRIGGER trg_log_mov_order_delivered AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_movement_order_delivered();

CREATE OR REPLACE FUNCTION public.log_movement_customer_return()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status IN ('approved','completed','success') AND OLD.status NOT IN ('approved','completed','success') THEN
    INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_by)
    SELECT cri.product_id,'RETURN_IN', cri.quantity, 'customer_returns', NEW.id, 'Customer return '||NEW.return_number, auth.uid()
    FROM public.customer_return_items cri WHERE cri.customer_return_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_log_mov_customer_return ON public.customer_returns;
CREATE TRIGGER trg_log_mov_customer_return AFTER UPDATE ON public.customer_returns
FOR EACH ROW EXECUTE FUNCTION public.log_movement_customer_return();

CREATE OR REPLACE FUNCTION public.log_movement_supplier_return()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (TG_OP='INSERT' AND NEW.status='success') OR
     (TG_OP='UPDATE' AND OLD.status<>'success' AND NEW.status='success') THEN
    INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_by)
    SELECT ri.product_id,'SUPPLIER_RETURN_OUT', -ri.quantity, 'returns', NEW.id, 'Supplier return '||NEW.return_number, auth.uid()
    FROM public.return_items ri WHERE ri.return_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_log_mov_supplier_return ON public.returns;
CREATE TRIGGER trg_log_mov_supplier_return AFTER INSERT OR UPDATE ON public.returns
FOR EACH ROW EXECUTE FUNCTION public.log_movement_supplier_return();

CREATE OR REPLACE FUNCTION public.log_movement_stock_adjustment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_by)
  VALUES (NEW.product_id,'ADJUSTMENT', NEW.quantity_change, 'stock_adjustments', NEW.id, NEW.reason, COALESCE(NEW.user_id,auth.uid()));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_log_mov_stock_adj ON public.stock_adjustments;
CREATE TRIGGER trg_log_mov_stock_adj AFTER INSERT ON public.stock_adjustments
FOR EACH ROW EXECUTE FUNCTION public.log_movement_stock_adjustment();

-- Reward redemption approved → log reward stock movement (no product_id; skip ledger to avoid FK issue)

-- ---------- D. Loyalty automation for frontend orders ----------
CREATE OR REPLACE FUNCTION public.apply_order_loyalty_on_delivered()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_points int; v_amount numeric;
BEGIN
  IF NEW.customer_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.status='delivered' AND (OLD.status IS NULL OR OLD.status<>'delivered') THEN
    SELECT COALESCE(SUM(COALESCE(p.loyalty_points,0)*oi.quantity),0)
      INTO v_points
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id;

    v_amount := COALESCE(NEW.total_amount,0);

    UPDATE public.customers
       SET total_points = COALESCE(total_points,0) + v_points,
           total_spent  = COALESCE(total_spent,0)  + v_amount
     WHERE id = NEW.customer_id;

    IF v_points > 0 THEN
      INSERT INTO public.point_transactions(customer_id, points_change, description)
      VALUES (NEW.customer_id, v_points, 'Order '||NEW.order_number||' delivered');
    END IF;

  ELSIF OLD.status='delivered' AND NEW.status<>'delivered' THEN
    SELECT COALESCE(SUM(COALESCE(p.loyalty_points,0)*oi.quantity),0)
      INTO v_points
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id;

    v_amount := COALESCE(NEW.total_amount,0);

    UPDATE public.customers
       SET total_points = GREATEST(0, COALESCE(total_points,0) - v_points),
           total_spent  = GREATEST(0, COALESCE(total_spent,0)  - v_amount)
     WHERE id = NEW.customer_id;

    IF v_points > 0 THEN
      INSERT INTO public.point_transactions(customer_id, points_change, description)
      VALUES (NEW.customer_id, -v_points, 'Order '||NEW.order_number||' undelivered (rollback)');
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_apply_order_loyalty ON public.orders;
CREATE TRIGGER trg_apply_order_loyalty AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.apply_order_loyalty_on_delivered();

-- ---------- E. Backfill historical customer aggregates ----------
-- Rebuild total_spent / total_points strictly from source-of-truth tables.
WITH pos_agg AS (
  SELECT customer_id,
         COALESCE(SUM(total_amount),0) AS spent,
         COALESCE(SUM(points_earned),0) AS earned,
         COALESCE(SUM(points_used),0) AS used
  FROM public.transactions WHERE customer_id IS NOT NULL GROUP BY customer_id
),
order_agg AS (
  SELECT o.customer_id,
         COALESCE(SUM(o.total_amount),0) AS spent,
         COALESCE(SUM(item_pts.pts),0) AS earned
  FROM public.orders o
  LEFT JOIN LATERAL (
    SELECT SUM(COALESCE(p.loyalty_points,0)*oi.quantity) AS pts
    FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
    WHERE oi.order_id=o.id
  ) item_pts ON true
  WHERE o.status='delivered' AND o.customer_id IS NOT NULL
  GROUP BY o.customer_id
),
exchange_agg AS (
  SELECT customer_id, COALESCE(SUM(total_points_cost),0) AS used
  FROM public.point_exchanges WHERE status='completed' GROUP BY customer_id
)
UPDATE public.customers c SET
  total_spent  = COALESCE(po.spent,0) + COALESCE(oa.spent,0),
  total_points = GREATEST(0,
      COALESCE(po.earned,0) - COALESCE(po.used,0)
    + COALESCE(oa.earned,0)
    - COALESCE(ex.used,0))
FROM public.customers c2
LEFT JOIN pos_agg po ON po.customer_id = c2.id
LEFT JOIN order_agg oa ON oa.customer_id = c2.id
LEFT JOIN exchange_agg ex ON ex.customer_id = c2.id
WHERE c.id = c2.id;

-- Backfill point_transactions for delivered orders that have none
INSERT INTO public.point_transactions(customer_id, points_change, description, created_at)
SELECT o.customer_id,
       (SELECT COALESCE(SUM(COALESCE(p.loyalty_points,0)*oi.quantity),0)
          FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
         WHERE oi.order_id=o.id) AS pts,
       'Backfill: Order '||o.order_number||' delivered',
       o.updated_at
FROM public.orders o
WHERE o.status='delivered' AND o.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.point_transactions pt
    WHERE pt.customer_id=o.customer_id
      AND pt.description LIKE '%Order '||o.order_number||'%'
  )
  AND (SELECT COALESCE(SUM(COALESCE(p.loyalty_points,0)*oi.quantity),0)
         FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id
        WHERE oi.order_id=o.id) > 0;

-- Backfill stock_movements ledger from historical data (avoid duplicates via NOT EXISTS)
INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_at)
SELECT ti.product_id,'SALE_OUT', -ti.quantity, 'transaction_items', ti.id, 'Backfill POS', ti.created_at
FROM public.transaction_items ti
WHERE NOT EXISTS (SELECT 1 FROM public.stock_movements sm WHERE sm.reference_table='transaction_items' AND sm.reference_id=ti.id);

INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_at)
SELECT pi.product_id,'PURCHASE_IN', pi.quantity, 'purchase_items', pi.id, 'Backfill Purchase', pi.created_at
FROM public.purchase_items pi
WHERE NOT EXISTS (SELECT 1 FROM public.stock_movements sm WHERE sm.reference_table='purchase_items' AND sm.reference_id=pi.id);

INSERT INTO public.stock_movements(product_id, movement_type, quantity, reference_table, reference_id, notes, created_at)
SELECT oi.product_id,'ONLINE_ORDER_OUT', -oi.quantity, 'orders', o.id, 'Backfill Order '||o.order_number, o.updated_at
FROM public.orders o JOIN public.order_items oi ON oi.order_id=o.id
WHERE o.status='delivered'
  AND NOT EXISTS (SELECT 1 FROM public.stock_movements sm WHERE sm.reference_table='orders' AND sm.reference_id=o.id);
