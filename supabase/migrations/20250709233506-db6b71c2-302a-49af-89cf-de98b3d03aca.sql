
-- Drop existing triggers and functions that might interfere
DROP TRIGGER IF EXISTS update_stock_on_return_trigger ON returns;
DROP TRIGGER IF EXISTS update_stock_on_return_items_trigger ON return_items;
DROP FUNCTION IF EXISTS update_stock_on_return() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_return_success() CASCADE;

-- Create improved function to handle return stock logic
CREATE OR REPLACE FUNCTION update_stock_on_return_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT operation (new return)
  IF TG_OP = 'INSERT' THEN
    -- If status is 'success', decrease stock
    IF NEW.status = 'success' THEN
      UPDATE public.products 
      SET current_stock = current_stock - ri.quantity
      FROM public.return_items ri
      WHERE ri.return_id = NEW.id AND products.id = ri.product_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE operation (status change)
  IF TG_OP = 'UPDATE' THEN
    -- If status changed from 'success' to 'process', restore stock
    IF OLD.status = 'success' AND NEW.status = 'process' THEN
      UPDATE public.products 
      SET current_stock = current_stock + ri.quantity
      FROM public.return_items ri
      WHERE ri.return_id = NEW.id AND products.id = ri.product_id;
    -- If status changed from 'process' to 'success', decrease stock
    ELSIF OLD.status = 'process' AND NEW.status = 'success' THEN
      UPDATE public.products 
      SET current_stock = current_stock - ri.quantity
      FROM public.return_items ri
      WHERE ri.return_id = NEW.id AND products.id = ri.product_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE operation
  IF TG_OP = 'DELETE' THEN
    -- If deleted return had 'success' status, restore stock
    IF OLD.status = 'success' THEN
      UPDATE public.products 
      SET current_stock = current_stock + ri.quantity
      FROM public.return_items ri
      WHERE ri.return_id = OLD.id AND products.id = ri.product_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for returns table
CREATE TRIGGER returns_stock_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_return_status_change();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_total_points ON customers(total_points);
CREATE INDEX IF NOT EXISTS idx_point_transactions_customer_id ON point_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_exchanges_customer_id ON point_exchanges(customer_id);

-- Update settings table with store information if not exists
INSERT INTO settings (key, value) VALUES 
('store_name', '{"name": "Waroeng Kami"}'),
('store_phone', '{"phone": "+62 812-3456-7890"}'),
('store_address', '{"address": "Jl. Raya No. 123, Jakarta"}'),
('store_email', '{"email": "info@waroengkami.com"}')
ON CONFLICT (key) DO NOTHING;

-- Function to get customer statistics
CREATE OR REPLACE FUNCTION get_customer_statistics()
RETURNS TABLE(
  total_customers INTEGER,
  active_customers_this_month INTEGER,
  total_unredeemed_points BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM customers) as total_customers,
    (SELECT COUNT(*)::INTEGER FROM customers 
     WHERE created_at >= date_trunc('month', CURRENT_DATE)) as active_customers_this_month,
    (SELECT COALESCE(SUM(total_points), 0)::BIGINT FROM customers) as total_unredeemed_points;
END;
$$;
