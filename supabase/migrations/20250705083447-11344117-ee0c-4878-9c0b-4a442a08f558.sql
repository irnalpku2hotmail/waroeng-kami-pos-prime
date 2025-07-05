
-- Update the return stock trigger to only reduce stock when status changes to 'success'
DROP TRIGGER IF EXISTS update_stock_on_return_items_trigger ON return_items;
DROP FUNCTION IF EXISTS update_stock_on_return();

-- Create new function that handles return stock updates based on status
CREATE OR REPLACE FUNCTION public.update_stock_on_return_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only trigger when status changes to 'success'
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    -- Update stock for all return items - reduce stock when return is successful
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
$function$;

-- Create trigger on returns table for status changes
CREATE TRIGGER update_stock_on_return_status_trigger
  AFTER UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_return_status_change();

-- Remove the old trigger function for return_items if it exists
DROP FUNCTION IF EXISTS public.update_stock_on_return_item();
