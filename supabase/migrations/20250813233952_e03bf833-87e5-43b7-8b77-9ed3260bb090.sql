
-- Fix privilege escalation vulnerability in profiles table
-- This prevents users from updating their own role field

-- First, drop the existing problematic policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create separate policies for different update scenarios
-- Policy 1: Users can update their own profile data (except role and id)
CREATE POLICY "Users can update own profile data" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND OLD.role = NEW.role  -- Prevent role changes
    AND OLD.id = NEW.id      -- Prevent id changes
  );

-- Policy 2: Only admins can update user roles
CREATE POLICY "Admins can update user roles" ON public.profiles
  FOR UPDATE 
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Fix database functions to prevent schema manipulation attacks
-- Update all functions to include proper search_path setting

CREATE OR REPLACE FUNCTION public.generate_customer_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  next_num INTEGER;
  customer_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.customers
  WHERE customer_code LIKE 'CST%';
  
  customer_code := 'CST' || LPAD(next_num::TEXT, 6, '0');
  RETURN customer_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_permission(user_id uuid, resource_name text, permission_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  user_role_val user_role;
  has_permission BOOLEAN := false;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM public.profiles WHERE id = user_id;
  
  -- Check permission based on type
  SELECT 
    CASE permission_type
      WHEN 'create' THEN can_create
      WHEN 'read' THEN can_read
      WHEN 'update' THEN can_update
      WHEN 'delete' THEN can_delete
      ELSE false
    END
  INTO has_permission
  FROM public.role_permissions 
  WHERE role = user_role_val AND resource = resource_name;
  
  RETURN COALESCE(has_permission, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_customer_statistics()
RETURNS TABLE(total_customers integer, active_customers_this_month integer, total_unredeemed_points bigint)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.customers) as total_customers,
    (SELECT COUNT(*)::INTEGER FROM public.customers 
     WHERE created_at >= date_trunc('month', CURRENT_DATE)) as active_customers_this_month,
    (SELECT COALESCE(SUM(total_points), 0)::BIGINT FROM public.customers) as total_unredeemed_points;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_customer_purchase_history(customer_uuid uuid)
RETURNS TABLE(transaction_id uuid, transaction_number text, total_amount numeric, points_earned integer, points_used integer, created_at timestamp with time zone, items jsonb)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.transaction_number,
    t.total_amount,
    t.points_earned,
    t.points_used,
    t.created_at,
    jsonb_agg(
      jsonb_build_object(
        'product_name', p.name,
        'quantity', ti.quantity,
        'unit_price', ti.unit_price,
        'total_price', ti.total_price
      )
    ) as items
  FROM public.transactions t
  LEFT JOIN public.transaction_items ti ON t.id = ti.transaction_id
  LEFT JOIN public.products p ON ti.product_id = p.id
  WHERE t.customer_id = customer_uuid
  GROUP BY t.id, t.transaction_number, t.total_amount, t.points_earned, t.points_used, t.created_at
  ORDER BY t.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_credit_due_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.payment_method = 'credit' AND NEW.due_date IS NULL THEN
    NEW.due_date = NEW.purchase_date + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease stock when transaction item is created
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
    -- Increase stock when transaction item is deleted
    UPDATE public.products 
    SET current_stock = current_stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_customer_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code := generate_customer_code();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff'::user_role
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_stock_on_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  base_unit_id UUID;
  converted_quantity NUMERIC;
  conversion_factor NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get product's base unit
    SELECT unit_id INTO base_unit_id FROM public.products WHERE id = NEW.product_id;
    
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
    SELECT unit_id INTO base_unit_id FROM public.products WHERE id = NEW.product_id;
    
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
    SELECT unit_id INTO base_unit_id FROM public.products WHERE id = OLD.product_id;
    
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_supplier_return_history(supplier_uuid uuid)
RETURNS TABLE(return_id uuid, return_number text, total_amount numeric, return_date date, status text, reason text, created_at timestamp with time zone, items jsonb)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.return_number,
    r.total_amount,
    r.return_date,
    r.status,
    r.reason,
    r.created_at,
    jsonb_agg(
      jsonb_build_object(
        'product_name', p.name,
        'quantity', ri.quantity,
        'unit_cost', ri.unit_cost,
        'total_cost', ri.total_cost
      )
    ) as items
  FROM public.returns r
  LEFT JOIN public.return_items ri ON r.id = ri.return_id
  LEFT JOIN public.products p ON ri.product_id = p.id
  WHERE r.supplier_id = supplier_uuid
  GROUP BY r.id, r.return_number, r.total_amount, r.return_date, r.status, r.reason, r.created_at
  ORDER BY r.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE order_number LIKE 'ORD%';
  
  order_num := 'ORD' || LPAD(next_num::TEXT, 6, '0');
  RETURN order_num;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8 character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE referral_codes.code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_supplier_purchase_history(supplier_uuid uuid)
RETURNS TABLE(purchase_id uuid, purchase_number text, total_amount numeric, purchase_date date, payment_method text, status text, created_at timestamp with time zone, items jsonb)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.purchase_number,
    p.total_amount,
    p.purchase_date,
    p.payment_method,
    CASE 
      WHEN p.payment_method = 'credit' AND p.due_date < CURRENT_DATE THEN 'overdue'
      WHEN p.payment_method = 'credit' THEN 'pending'
      ELSE 'paid'
    END as status,
    p.created_at,
    jsonb_agg(
      jsonb_build_object(
        'product_name', pr.name,
        'quantity', pi.quantity,
        'unit_cost', pi.unit_cost,
        'total_cost', pi.total_cost,
        'expiration_date', pi.expiration_date
      )
    ) as items
  FROM public.purchases p
  LEFT JOIN public.purchase_items pi ON p.id = pi.purchase_id
  LEFT JOIN public.products pr ON pi.product_id = pr.id
  WHERE p.supplier_id = supplier_uuid
  GROUP BY p.id, p.purchase_number, p.total_amount, p.purchase_date, p.payment_method, p.created_at
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_unit_conversion_factor(p_product_id uuid, p_from_unit_id uuid, p_to_unit_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  conversion_factor NUMERIC;
BEGIN
  -- If same unit, return 1
  IF p_from_unit_id = p_to_unit_id THEN
    RETURN 1;
  END IF;
  
  -- Look for direct conversion
  SELECT uc.conversion_factor INTO conversion_factor
  FROM public.unit_conversions uc
  WHERE uc.product_id = p_product_id
    AND uc.from_unit_id = p_from_unit_id
    AND uc.to_unit_id = p_to_unit_id;
  
  -- If found, return it
  IF conversion_factor IS NOT NULL THEN
    RETURN conversion_factor;
  END IF;
  
  -- Look for reverse conversion (divide by factor)
  SELECT (1.0 / uc.conversion_factor) INTO conversion_factor
  FROM public.unit_conversions uc
  WHERE uc.product_id = p_product_id
    AND uc.from_unit_id = p_to_unit_id
    AND uc.to_unit_id = p_from_unit_id;
  
  -- Return conversion factor or 1 if not found
  RETURN COALESCE(conversion_factor, 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  referrer_user_id UUID;
  ref_code TEXT;
BEGIN
  -- Get referral code from user metadata
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF ref_code IS NOT NULL THEN
    -- Find the referrer
    SELECT user_id INTO referrer_user_id
    FROM public.referral_codes 
    WHERE code = ref_code AND is_active = true;
    
    IF referrer_user_id IS NOT NULL THEN
      -- Create referral history record
      INSERT INTO public.referral_history (referrer_id, referred_user_id, referral_code, points_awarded)
      VALUES (referrer_user_id, NEW.id, ref_code, 10);
      
      -- Update referrer's stats
      UPDATE public.referral_codes 
      SET points_earned = points_earned + 10,
          total_referrals = total_referrals + 1,
          updated_at = now()
      WHERE user_id = referrer_user_id AND code = ref_code;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_purchase_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_stock_on_order_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_stock_on_return_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

-- Add audit logging table for role changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_role user_role NOT NULL,
  new_role user_role NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone DEFAULT now(),
  reason text
);

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for role change audit - only admins can view
CREATE POLICY "Admins can view role change audit" ON public.role_change_audit
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by)
    VALUES (NEW.id, OLD.role, NEW.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER role_change_audit_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();
