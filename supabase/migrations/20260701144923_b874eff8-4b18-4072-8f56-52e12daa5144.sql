
-- Remove duplicate stock triggers to prevent multi-decrement on delivered frontend orders.

-- orders table: keep one delivery-stock trigger
DROP TRIGGER IF EXISTS update_stock_on_order_delivery_trigger ON public.orders;

-- transaction_items: keep one stock trigger (transaction_items_stock_update)
DROP TRIGGER IF EXISTS update_stock_on_sale_trigger ON public.transaction_items;

-- Prevent double-decrement when transaction_items are auto-synced from a delivered order
-- (order delivery already decremented stock via update_stock_on_order_delivery)
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_source text;
BEGIN
  -- Skip stock changes for items belonging to synced FRONTEND_ORDER transactions
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT source INTO v_source FROM public.transactions WHERE id = NEW.transaction_id;
    IF v_source = 'FRONTEND_ORDER' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT source INTO v_source FROM public.transactions WHERE id = OLD.transaction_id;
    IF v_source = 'FRONTEND_ORDER' THEN
      RETURN OLD;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE public.products SET current_stock = current_stock - NEW.quantity WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.products SET current_stock = current_stock + OLD.quantity - NEW.quantity WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products SET current_stock = current_stock + OLD.quantity WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Also skip stock-movement logging for synced FRONTEND_ORDER transaction_items (order path already logs ONLINE_ORDER_OUT)
CREATE OR REPLACE FUNCTION public.log_movement_transaction_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_source text;
BEGIN
  IF TG_OP='INSERT' THEN
    SELECT source INTO v_source FROM public.transactions WHERE id = NEW.transaction_id;
    IF v_source = 'FRONTEND_ORDER' THEN RETURN NEW; END IF;
    PERFORM log_stock_movement(NEW.product_id,'SALE_OUT',-NEW.quantity,'transaction_items',NEW.id,'POS sale');
  ELSIF TG_OP='DELETE' THEN
    SELECT source INTO v_source FROM public.transactions WHERE id = OLD.transaction_id;
    IF v_source = 'FRONTEND_ORDER' THEN RETURN OLD; END IF;
    PERFORM log_stock_movement(OLD.product_id,'SALE_OUT',OLD.quantity,'transaction_items',OLD.id,'POS sale reversed');
  END IF;
  RETURN COALESCE(NEW,OLD);
END $function$;

-- Backfill: restore stock that was over-deducted for the 3 existing FRONTEND_ORDER transactions.
-- Each delivered order deducted: 1x from order trigger (correct) + 2x extra from 2 transaction_items triggers +
-- 1x extra from duplicate order trigger  = 3 extra decrements per unit.
UPDATE public.products p
SET current_stock = current_stock + agg.extra_qty
FROM (
  SELECT ti.product_id, SUM(ti.quantity)*3 AS extra_qty
  FROM public.transactions t
  JOIN public.transaction_items ti ON ti.transaction_id = t.id
  WHERE t.source='FRONTEND_ORDER'
  GROUP BY ti.product_id
) agg
WHERE p.id = agg.product_id;
