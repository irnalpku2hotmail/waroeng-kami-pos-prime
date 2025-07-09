
-- Drop all existing stock-related triggers that might cause duplicate stock updates
DROP TRIGGER IF EXISTS purchase_items_stock_trigger ON purchase_items;
DROP TRIGGER IF EXISTS update_stock_on_order_delivery_trigger ON orders;
DROP TRIGGER IF EXISTS update_stock_on_return_trigger ON return_items;
DROP TRIGGER IF EXISTS update_stock_on_return_status_trigger ON returns;
DROP TRIGGER IF EXISTS update_product_stock_trigger ON transaction_items;

-- Keep only the purchase stock update trigger (the main one we want)
-- Update the function to be more robust
CREATE OR REPLACE FUNCTION public.update_stock_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  base_unit_id UUID;
  converted_quantity NUMERIC;
  conversion_factor NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get product's base unit
    SELECT unit_id INTO base_unit_id FROM products WHERE id = NEW.product_id;
    
    -- Calculate conversion factor if purchase unit is different from base unit
    IF NEW.purchase_unit_id IS NOT NULL AND NEW.purchase_unit_id != base_unit_id THEN
      SELECT get_unit_conversion_factor(NEW.product_id, NEW.purchase_unit_id, base_unit_id) INTO conversion_factor;
      converted_quantity := NEW.quantity * COALESCE(conversion_factor, 1);
    ELSE
      converted_quantity := NEW.quantity;
    END IF;
    
    -- Update stock with converted quantity
    UPDATE public.products 
    SET current_stock = current_stock + converted_quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Get product's base unit
    SELECT unit_id INTO base_unit_id FROM products WHERE id = NEW.product_id;
    
    -- Calculate old converted quantity and subtract it
    IF OLD.purchase_unit_id IS NOT NULL AND OLD.purchase_unit_id != base_unit_id THEN
      SELECT get_unit_conversion_factor(OLD.product_id, OLD.purchase_unit_id, base_unit_id) INTO conversion_factor;
      converted_quantity := OLD.quantity * COALESCE(conversion_factor, 1);
    ELSE
      converted_quantity := OLD.quantity;
    END IF;
    
    -- Subtract old quantity
    UPDATE public.products 
    SET current_stock = current_stock - converted_quantity
    WHERE id = OLD.product_id;
    
    -- Calculate new converted quantity and add it
    IF NEW.purchase_unit_id IS NOT NULL AND NEW.purchase_unit_id != base_unit_id THEN
      SELECT get_unit_conversion_factor(NEW.product_id, NEW.purchase_unit_id, base_unit_id) INTO conversion_factor;
      converted_quantity := NEW.quantity * COALESCE(conversion_factor, 1);
    ELSE
      converted_quantity := NEW.quantity;
    END IF;
    
    -- Add new quantity
    UPDATE public.products 
    SET current_stock = current_stock + converted_quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get product's base unit
    SELECT unit_id INTO base_unit_id FROM products WHERE id = OLD.product_id;
    
    -- Calculate converted quantity to subtract
    IF OLD.purchase_unit_id IS NOT NULL AND OLD.purchase_unit_id != base_unit_id THEN
      SELECT get_unit_conversion_factor(OLD.product_id, OLD.purchase_unit_id, base_unit_id) INTO conversion_factor;
      converted_quantity := OLD.quantity * COALESCE(conversion_factor, 1);
    ELSE
      converted_quantity := OLD.quantity;
    END IF;
    
    -- Decrease stock with converted quantity
    UPDATE public.products 
    SET current_stock = current_stock - converted_quantity
    WHERE id = OLD.product_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate only the purchase items stock trigger
CREATE TRIGGER purchase_items_stock_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_purchase();

-- Create a new function for return items that only affects stock when status is 'success'
CREATE OR REPLACE FUNCTION public.update_stock_on_return_success()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create trigger for return status changes
CREATE TRIGGER update_stock_on_return_status_trigger
  AFTER UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_return_success();

-- Create a simple function for transaction items (sales) that only decreases stock
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease stock when sale item is created
    UPDATE public.products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity change
    UPDATE public.products 
    SET current_stock = current_stock + OLD.quantity - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Increase stock when sale item is deleted
    UPDATE public.products 
    SET current_stock = current_stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for transaction items (sales only)
CREATE TRIGGER update_stock_on_sale_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transaction_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();

-- Create function for order delivery (frontend orders)
CREATE OR REPLACE FUNCTION public.update_stock_on_order_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Update stock for all order items
    UPDATE public.products 
    SET current_stock = current_stock - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND products.id = oi.product_id;
  -- If status changes from 'delivered' to something else, restore stock
  ELSIF OLD.status = 'delivered' AND NEW.status != 'delivered' THEN
    UPDATE public.products 
    SET current_stock = current_stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND products.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order delivery
CREATE TRIGGER update_stock_on_order_delivery_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_order_delivery();
