
-- Update handle_new_user to also create a customer record for buyer signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role user_role;
  v_full_name text;
  v_phone text;
  v_address text;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_address := NULLIF(NEW.raw_user_meta_data->>'address', '');

  INSERT INTO public.profiles (id, email, full_name, role, phone, address)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, v_phone, v_address);

  -- Auto-create customer record for buyers (avoid duplicates by email)
  IF v_role = 'buyer' THEN
    INSERT INTO public.customers (name, email, phone, address)
    SELECT v_full_name, NEW.email, v_phone, v_address
    WHERE NOT EXISTS (
      SELECT 1 FROM public.customers c WHERE c.email = NEW.email
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill: insert existing buyer profiles into customers if not already present
INSERT INTO public.customers (name, email, phone, address, created_at)
SELECT p.full_name, p.email, p.phone, p.address, p.created_at
FROM public.profiles p
WHERE p.role = 'buyer'
  AND p.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.email = p.email);
