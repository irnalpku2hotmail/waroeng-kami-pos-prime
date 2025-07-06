
-- Create purchase_payments table if not exists
CREATE TABLE IF NOT EXISTS public.purchase_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_payments
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view purchase payments" ON public.purchase_payments;
DROP POLICY IF EXISTS "Staff can create purchase payments" ON public.purchase_payments;
DROP POLICY IF EXISTS "Staff can update purchase payments" ON public.purchase_payments;
DROP POLICY IF EXISTS "Admins can delete purchase payments" ON public.purchase_payments;

-- Create RLS policies for purchase_payments
CREATE POLICY "Everyone can view purchase payments" 
  ON public.purchase_payments 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create purchase payments" 
  ON public.purchase_payments 
  FOR INSERT 
  WITH CHECK (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]) 
    AND auth.uid() = user_id
  );

CREATE POLICY "Staff can update purchase payments" 
  ON public.purchase_payments 
  FOR UPDATE 
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Admins can delete purchase payments" 
  ON public.purchase_payments 
  FOR DELETE 
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Add payment_status column to purchases if not exists
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Update existing purchases payment status
UPDATE public.purchases 
SET payment_status = CASE 
  WHEN payment_method = 'cash' THEN 'paid'
  WHEN payment_method = 'credit' THEN 'unpaid'
  ELSE 'unpaid'
END
WHERE payment_status IS NULL OR payment_status = 'unpaid';

-- Function to update purchase payment status
CREATE OR REPLACE FUNCTION public.update_purchase_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  purchase_total NUMERIC;
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Get total amount of the purchase
    SELECT total_amount INTO purchase_total 
    FROM public.purchases 
    WHERE id = NEW.purchase_id;
    
    -- Calculate total paid amount
    SELECT COALESCE(SUM(payment_amount), 0) INTO total_paid
    FROM public.purchase_payments 
    WHERE purchase_id = NEW.purchase_id;
    
    -- Update purchase payment status
    UPDATE public.purchases 
    SET payment_status = CASE 
      WHEN total_paid >= purchase_total THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'unpaid'
    END
    WHERE id = NEW.purchase_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Get total amount of the purchase
    SELECT total_amount INTO purchase_total 
    FROM public.purchases 
    WHERE id = OLD.purchase_id;
    
    -- Calculate total paid amount (excluding the deleted payment)
    SELECT COALESCE(SUM(payment_amount), 0) INTO total_paid
    FROM public.purchase_payments 
    WHERE purchase_id = OLD.purchase_id AND id != OLD.id;
    
    -- Update purchase payment status
    UPDATE public.purchases 
    SET payment_status = CASE 
      WHEN total_paid >= purchase_total THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'unpaid'
    END
    WHERE id = OLD.purchase_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for purchase payment status updates
DROP TRIGGER IF EXISTS update_purchase_payment_status_trigger ON purchase_payments;
CREATE TRIGGER update_purchase_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_payments
  FOR EACH ROW EXECUTE FUNCTION update_purchase_payment_status();

-- Fix stock update function to prevent double counting
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
    
    -- Calculate old converted quantity
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
    
    -- Calculate new converted quantity
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

-- Ensure trigger only exists on purchase_items
DROP TRIGGER IF EXISTS purchase_items_stock_trigger ON purchase_items;
CREATE TRIGGER purchase_items_stock_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_purchase();

-- Remove any other purchase-related stock triggers to prevent double counting
DROP TRIGGER IF EXISTS purchase_stock_trigger ON purchases;

-- Fix return stock update function to only update when status changes to success
CREATE OR REPLACE FUNCTION public.update_stock_on_return_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'success'
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    -- Update stock for all return items
    UPDATE public.products 
    SET current_stock = current_stock - ri.quantity
    FROM public.return_items ri
    WHERE ri.return_id = NEW.id AND products.id = ri.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for return status changes
DROP TRIGGER IF EXISTS update_stock_on_return_status_trigger ON returns;
CREATE TRIGGER update_stock_on_return_status_trigger
  AFTER UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_return_status();

-- Remove the old return_items stock trigger to prevent double stock reduction
DROP TRIGGER IF EXISTS return_items_stock_trigger ON return_items;
