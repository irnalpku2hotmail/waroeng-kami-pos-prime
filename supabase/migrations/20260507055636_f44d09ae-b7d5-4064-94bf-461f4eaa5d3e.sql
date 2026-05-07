
-- Fix 1: Enable RLS on product_brands so existing policies are enforced
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;

-- Fix 2: Restrict settings writes to admin/manager (drop blanket-true write policies)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.settings;

CREATE POLICY "Staff can insert settings"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Staff can update settings"
ON public.settings
FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Admins can delete settings"
ON public.settings
FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin'::user_role);
