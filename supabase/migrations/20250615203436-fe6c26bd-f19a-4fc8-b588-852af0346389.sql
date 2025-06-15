
-- Update unit_conversions table to have proper foreign key relationships
ALTER TABLE public.unit_conversions 
DROP COLUMN IF EXISTS from_unit,
DROP COLUMN IF EXISTS to_unit;

-- Ensure foreign key columns exist and are properly referenced
ALTER TABLE public.unit_conversions 
ADD CONSTRAINT fk_unit_conversions_from_unit 
FOREIGN KEY (from_unit_id) REFERENCES public.units(id),
ADD CONSTRAINT fk_unit_conversions_to_unit 
FOREIGN KEY (to_unit_id) REFERENCES public.units(id),
ADD CONSTRAINT fk_unit_conversions_product 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Add purchase_unit_id to purchase_items to track the unit used for purchasing
ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS purchase_unit_id UUID REFERENCES public.units(id),
ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC DEFAULT 1;

-- Create function to get unit conversion factor
CREATE OR REPLACE FUNCTION get_unit_conversion_factor(
  p_product_id UUID,
  p_from_unit_id UUID,
  p_to_unit_id UUID
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  conversion_factor NUMERIC;
BEGIN
  -- If same unit, return 1
  IF p_from_unit_id = p_to_unit_id THEN
    RETURN 1;
  END IF;
  
  -- Look for direct conversion
  SELECT uc.conversion_factor INTO conversion_factor
  FROM unit_conversions uc
  WHERE uc.product_id = p_product_id
    AND uc.from_unit_id = p_from_unit_id
    AND uc.to_unit_id = p_to_unit_id;
  
  -- If found, return it
  IF conversion_factor IS NOT NULL THEN
    RETURN conversion_factor;
  END IF;
  
  -- Look for reverse conversion (divide by factor)
  SELECT (1.0 / uc.conversion_factor) INTO conversion_factor
  FROM unit_conversions uc
  WHERE uc.product_id = p_product_id
    AND uc.from_unit_id = p_to_unit_id
    AND uc.to_unit_id = p_from_unit_id;
  
  -- Return conversion factor or 1 if not found
  RETURN COALESCE(conversion_factor, 1);
END;
$$;

-- Update the stock update trigger to handle unit conversions
CREATE OR REPLACE FUNCTION public.update_stock_on_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      converted_quantity := NEW.quantity * conversion_factor;
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
      converted_quantity := OLD.quantity * conversion_factor;
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
      converted_quantity := NEW.quantity * conversion_factor;
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
      converted_quantity := OLD.quantity * conversion_factor;
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
$$;
