
-- 1. Extend transactions to link back to originating frontend order
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'POS';

ALTER TABLE public.transactions ALTER COLUMN cashier_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_transactions_order_id
  ON public.transactions(order_id) WHERE order_id IS NOT NULL;

-- 2. Trigger: auto-create transaction + items when order becomes delivered
CREATE OR REPLACE FUNCTION public.sync_transaction_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_id uuid;
  v_payment public.transaction_type;
  v_tx_number text;
  v_next int;
BEGIN
  IF NEW.status <> 'delivered' THEN RETURN NEW; END IF;
  IF OLD.status = 'delivered' THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.transactions WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  v_payment := CASE lower(COALESCE(NEW.payment_method,'cod'))
                 WHEN 'transfer' THEN 'transfer'::public.transaction_type
                 WHEN 'credit'   THEN 'credit'::public.transaction_type
                 ELSE 'cash'::public.transaction_type
               END;

  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 'TRX-ORD-(\d+)') AS int)),0)+1
    INTO v_next FROM public.transactions
    WHERE transaction_number LIKE 'TRX-ORD-%';
  v_tx_number := 'TRX-ORD-' || LPAD(v_next::text, 6, '0');

  INSERT INTO public.transactions(
    transaction_number, customer_id, cashier_id, total_amount,
    payment_type, payment_amount, paid_amount, is_credit,
    order_id, source, created_at
  ) VALUES (
    v_tx_number, NEW.customer_id, NULL, COALESCE(NEW.total_amount,0),
    v_payment, COALESCE(NEW.total_amount,0), COALESCE(NEW.total_amount,0),
    (v_payment='credit'), NEW.id, 'FRONTEND_ORDER', now()
  ) RETURNING id INTO v_tx_id;

  INSERT INTO public.transaction_items(transaction_id, product_id, quantity, unit_price, total_price)
  SELECT v_tx_id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price
  FROM public.order_items oi WHERE oi.order_id = NEW.id;

  -- customers.total_orders (if column exists)
  IF NEW.customer_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='total_orders'
  ) THEN
    UPDATE public.customers
      SET total_orders = COALESCE(total_orders,0) + 1
      WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_transaction_from_order ON public.orders;
CREATE TRIGGER trg_sync_transaction_from_order
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_transaction_from_order();

-- 3. Backfill: create transactions for historical delivered orders that never got one
DO $$
DECLARE r record; v_tx_id uuid; v_payment public.transaction_type; v_tx_number text; v_next int;
BEGIN
  FOR r IN
    SELECT o.* FROM public.orders o
    WHERE o.status='delivered'
      AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.order_id = o.id)
    ORDER BY o.created_at
  LOOP
    v_payment := CASE lower(COALESCE(r.payment_method,'cod'))
                   WHEN 'transfer' THEN 'transfer'::public.transaction_type
                   WHEN 'credit'   THEN 'credit'::public.transaction_type
                   ELSE 'cash'::public.transaction_type
                 END;

    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 'TRX-ORD-(\d+)') AS int)),0)+1
      INTO v_next FROM public.transactions WHERE transaction_number LIKE 'TRX-ORD-%';
    v_tx_number := 'TRX-ORD-' || LPAD(v_next::text, 6, '0');

    INSERT INTO public.transactions(
      transaction_number, customer_id, cashier_id, total_amount,
      payment_type, payment_amount, paid_amount, is_credit,
      order_id, source, created_at
    ) VALUES (
      v_tx_number, r.customer_id, NULL, COALESCE(r.total_amount,0),
      v_payment, COALESCE(r.total_amount,0), COALESCE(r.total_amount,0),
      (v_payment='credit'), r.id, 'FRONTEND_ORDER', r.created_at
    ) RETURNING id INTO v_tx_id;

    INSERT INTO public.transaction_items(transaction_id, product_id, quantity, unit_price, total_price)
    SELECT v_tx_id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price
    FROM public.order_items oi WHERE oi.order_id = r.id;
  END LOOP;
END $$;
