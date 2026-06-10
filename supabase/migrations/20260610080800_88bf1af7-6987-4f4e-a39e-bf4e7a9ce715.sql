
-- Drop duplicate stock triggers I added (originals already exist under legacy names)
DROP TRIGGER IF EXISTS trg_update_stock_on_sale ON public.transaction_items;
DROP TRIGGER IF EXISTS trg_update_stock_on_purchase ON public.purchase_items;
DROP TRIGGER IF EXISTS trg_update_stock_on_order_delivery ON public.orders;
DROP TRIGGER IF EXISTS trg_update_stock_on_return_status_change ON public.returns;
DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
DROP TRIGGER IF EXISTS trg_set_credit_due_date ON public.purchases;
DROP TRIGGER IF EXISTS trg_set_customer_return_number ON public.customer_returns;
DROP TRIGGER IF EXISTS trg_handle_product_price_change ON public.products;

-- Drop my duplicate updated_at triggers on tables that already had update_*_updated_at
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND t.tgname='trg_updated_at'
      AND EXISTS (
        SELECT 1 FROM pg_trigger t2 WHERE t2.tgrelid=c.oid
          AND t2.tgname = 'update_'||c.relname||'_updated_at'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON public.%I;', r.tbl);
  END LOOP;
END $$;
