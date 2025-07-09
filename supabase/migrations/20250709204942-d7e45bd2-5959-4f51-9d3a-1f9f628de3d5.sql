
-- Drop existing trigger and function if exists
DROP TRIGGER IF EXISTS trigger_update_stock_on_return_status ON public.returns;
DROP FUNCTION IF EXISTS update_stock_on_return_status();

-- Create improved function to handle stock updates when return status changes or returns are deleted
CREATE OR REPLACE FUNCTION public.update_stock_on_return_success()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE operation
  IF TG_OP = 'DELETE' THEN
    -- If the deleted record had 'success' status, restore stock
    IF OLD.status = 'success' THEN
      UPDATE public.products 
      SET current_stock = current_stock + ri.quantity
      FROM public.return_items ri
      WHERE ri.return_id = OLD.id AND products.id = ri.product_id;
    END IF;
    RETURN OLD;
  END IF;

  -- Only trigger when status changes to 'success'
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    -- Decrease stock for all return items
    UPDATE public.products 
    SET current_stock = current_stock - ri.quantity
    FROM public.return_items ri
    WHERE ri.return_id = NEW.id AND products.id = ri.product_id;
  -- If status changes from 'success' to something else, restore stock
  ELSIF OLD.status = 'success' AND NEW.status != 'success' THEN
    UPDATE public.products 
    SET current_stock = current_stock + ri.quantity
    FROM public.return_items ri
    WHERE ri.return_id = NEW.id AND products.id = ri.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for both UPDATE and DELETE operations
CREATE TRIGGER trigger_update_stock_on_return_status
  AFTER UPDATE OR DELETE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_return_success();
