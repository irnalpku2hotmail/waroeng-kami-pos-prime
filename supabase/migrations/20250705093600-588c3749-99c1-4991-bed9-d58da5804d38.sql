
-- Fix duplicate stock updates by removing triggers and ensuring only purchase items trigger updates stock
DROP TRIGGER IF EXISTS purchase_items_stock_trigger ON purchase_items;
DROP TRIGGER IF EXISTS purchase_stock_trigger ON purchases;

-- Update the stock update function to be more precise and prevent double counting
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

-- Recreate the trigger only on purchase_items table
CREATE TRIGGER purchase_items_stock_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_purchase();

-- Add payment status to purchases table for better tracking
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Update existing purchases payment status based on payment method
UPDATE public.purchases 
SET payment_status = CASE 
  WHEN payment_method = 'cash' THEN 'paid'
  WHEN payment_method = 'credit' THEN 'unpaid'
  ELSE 'unpaid'
END
WHERE payment_status IS NULL OR payment_status = 'unpaid';

-- Create purchase payments table for tracking credit purchase payments
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

-- Create function to update purchase payment status
CREATE OR REPLACE FUNCTION public.update_purchase_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  purchase_total NUMERIC;
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for purchase payment status updates
DROP TRIGGER IF EXISTS update_purchase_payment_status_trigger ON purchase_payments;
CREATE TRIGGER update_purchase_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_payments
  FOR EACH ROW EXECUTE FUNCTION update_purchase_payment_status();
