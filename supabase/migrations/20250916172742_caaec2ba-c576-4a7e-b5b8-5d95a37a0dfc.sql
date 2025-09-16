-- Create customer_returns table for customer returns (separate from supplier returns)
CREATE TABLE public.customer_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id),
  order_id UUID REFERENCES public.orders(id),
  return_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_return_items table
CREATE TABLE public.customer_return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_return_id UUID NOT NULL REFERENCES public.customer_returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_return_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_returns
CREATE POLICY "Staff can manage customer returns" 
ON public.customer_returns 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Everyone can view customer returns" 
ON public.customer_returns 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- RLS policies for customer_return_items
CREATE POLICY "Staff can manage customer return items" 
ON public.customer_return_items 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Everyone can view customer return items" 
ON public.customer_return_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Function to generate customer return number
CREATE OR REPLACE FUNCTION public.generate_customer_return_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  next_num INTEGER;
  return_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM customer_returns
  WHERE return_number LIKE 'CRT%';
  
  return_num := 'CRT' || LPAD(next_num::TEXT, 6, '0');
  RETURN return_num;
END;
$function$;

-- Trigger to auto-generate customer return number
CREATE OR REPLACE FUNCTION public.set_customer_return_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
    NEW.return_number := generate_customer_return_number();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_customer_return_number_trigger
  BEFORE INSERT ON public.customer_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_customer_return_number();

-- Add updated_at trigger
CREATE TRIGGER update_customer_returns_updated_at
  BEFORE UPDATE ON public.customer_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();