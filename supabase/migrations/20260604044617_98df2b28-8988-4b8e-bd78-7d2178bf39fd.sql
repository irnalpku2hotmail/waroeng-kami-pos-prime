
-- 1. Add profile_id column (1:1 link)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS profile_id uuid;

-- 2. Backfill profile_id from matching emails (case-insensitive)
UPDATE public.customers c
SET profile_id = p.id
FROM public.profiles p
WHERE c.profile_id IS NULL
  AND c.email IS NOT NULL
  AND lower(c.email) = lower(p.email);

-- 3. Create customer records for buyer profiles that don't have one
INSERT INTO public.customers (name, email, phone, address, profile_id)
SELECT p.full_name, p.email, p.phone, p.address, p.id
FROM public.profiles p
WHERE p.role = 'buyer'
  AND NOT EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.profile_id = p.id
       OR (c.email IS NOT NULL AND lower(c.email) = lower(p.email))
  );

-- 4. Add unique constraints (after dedupe) — partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS customers_profile_id_unique
  ON public.customers (profile_id) WHERE profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_unique
  ON public.customers (lower(email)) WHERE email IS NOT NULL;

-- 5. FK to profiles
DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Update trigger to set profile_id when auto-creating customer
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
  v_existing_customer uuid;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_address := NULLIF(NEW.raw_user_meta_data->>'address', '');

  INSERT INTO public.profiles (id, email, full_name, role, phone, address)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, v_phone, v_address);

  IF v_role = 'buyer' THEN
    -- Try to link existing customer by email first
    SELECT id INTO v_existing_customer
    FROM public.customers
    WHERE email IS NOT NULL AND lower(email) = lower(NEW.email)
    LIMIT 1;

    IF v_existing_customer IS NOT NULL THEN
      UPDATE public.customers
      SET profile_id = NEW.id,
          name = COALESCE(NULLIF(name,''), v_full_name),
          phone = COALESCE(phone, v_phone),
          address = COALESCE(address, v_address)
      WHERE id = v_existing_customer AND profile_id IS NULL;
    ELSE
      INSERT INTO public.customers (name, email, phone, address, profile_id)
      VALUES (v_full_name, NEW.email, v_phone, v_address, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 7. RPC: get or create customer for current authenticated user
CREATE OR REPLACE FUNCTION public.get_or_create_customer_for_current_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_phone text;
  v_address text;
  v_customer_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Lookup by profile_id
  SELECT id INTO v_customer_id FROM public.customers WHERE profile_id = v_user_id LIMIT 1;
  IF v_customer_id IS NOT NULL THEN RETURN v_customer_id; END IF;

  -- 2. Pull profile info
  SELECT email, full_name, phone, address
  INTO v_email, v_full_name, v_phone, v_address
  FROM public.profiles WHERE id = v_user_id;

  IF v_email IS NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- 3. Lookup existing customer by email and link
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE email IS NOT NULL AND lower(email) = lower(v_email)
  LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
    UPDATE public.customers SET profile_id = v_user_id
    WHERE id = v_customer_id AND profile_id IS NULL;
    RETURN v_customer_id;
  END IF;

  -- 4. Create new customer
  INSERT INTO public.customers (name, email, phone, address, profile_id)
  VALUES (COALESCE(v_full_name, v_email), v_email, v_phone, v_address, v_user_id)
  RETURNING id INTO v_customer_id;

  RETURN v_customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_customer_for_current_user() TO authenticated;
