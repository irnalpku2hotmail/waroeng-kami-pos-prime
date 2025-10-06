-- Drop trigger first before dropping the function
DROP TRIGGER IF EXISTS trigger_set_customer_code ON public.customers;
DROP FUNCTION IF EXISTS public.set_customer_code() CASCADE;
DROP FUNCTION IF EXISTS public.generate_customer_code();

-- Remove customer_code and qr_code_url columns from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS customer_code;
ALTER TABLE public.customers DROP COLUMN IF EXISTS qr_code_url;