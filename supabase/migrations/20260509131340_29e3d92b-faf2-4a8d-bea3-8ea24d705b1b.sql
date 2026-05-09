
-- ===== profiles =====
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- Users update own profile but cannot change role
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = get_user_role(auth.uid()));

-- Admins can update any profile (including role)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- ===== customers =====
DROP POLICY IF EXISTS "Everyone can view customers" ON public.customers;

-- ===== orders =====
DROP POLICY IF EXISTS "Users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;

CREATE POLICY "Staff can view all orders"
  ON public.orders FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role]));

CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT
  USING (customer_id IS NOT NULL AND customer_owns_transaction(customer_id));

CREATE POLICY "Customers can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
      OR (customer_id IS NOT NULL AND customer_owns_transaction(customer_id))
    )
  );

CREATE POLICY "Staff can update orders"
  ON public.orders FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role]));

CREATE POLICY "Staff can delete orders"
  ON public.orders FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== order_items =====
DROP POLICY IF EXISTS "Users can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order items" ON public.order_items;

CREATE POLICY "Staff can view all order items"
  ON public.order_items FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role]));

CREATE POLICY "Customers can view their own order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id IS NOT NULL
      AND customer_owns_transaction(o.customer_id)
  ));

CREATE POLICY "Authenticated can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
          OR (o.customer_id IS NOT NULL AND customer_owns_transaction(o.customer_id))
        )
    )
  );

CREATE POLICY "Staff can update order items"
  ON public.order_items FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role]));

CREATE POLICY "Staff can delete order items"
  ON public.order_items FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== point_exchanges =====
DROP POLICY IF EXISTS "Users can view point exchanges" ON public.point_exchanges;
DROP POLICY IF EXISTS "Users can create point exchanges" ON public.point_exchanges;
DROP POLICY IF EXISTS "Users can update point exchanges" ON public.point_exchanges;

CREATE POLICY "Staff can view all point exchanges"
  ON public.point_exchanges FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role]));

CREATE POLICY "Customers can view their own point exchanges"
  ON public.point_exchanges FOR SELECT
  USING (customer_id IS NOT NULL AND customer_owns_transaction(customer_id));

CREATE POLICY "Customers can create their own point exchanges"
  ON public.point_exchanges FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
      OR (customer_id IS NOT NULL AND customer_owns_transaction(customer_id))
    )
  );

CREATE POLICY "Staff can update point exchanges"
  ON public.point_exchanges FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role]));

CREATE POLICY "Staff can delete point exchanges"
  ON public.point_exchanges FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== flash_sales =====
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.flash_sales;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.flash_sales;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.flash_sales;

CREATE POLICY "Staff can insert flash sales"
  ON public.flash_sales FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can update flash sales"
  ON public.flash_sales FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can delete flash sales"
  ON public.flash_sales FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== flash_sale_items =====
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.flash_sale_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.flash_sale_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.flash_sale_items;

CREATE POLICY "Staff can insert flash sale items"
  ON public.flash_sale_items FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can update flash sale items"
  ON public.flash_sale_items FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can delete flash sale items"
  ON public.flash_sale_items FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== price_variants =====
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.price_variants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.price_variants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.price_variants;

CREATE POLICY "Staff can insert price variants"
  ON public.price_variants FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can update price variants"
  ON public.price_variants FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can delete price variants"
  ON public.price_variants FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== reward_items =====
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.reward_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.reward_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.reward_items;

CREATE POLICY "Staff can insert reward items"
  ON public.reward_items FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can update reward items"
  ON public.reward_items FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can delete reward items"
  ON public.reward_items FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== unit_conversions =====
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.unit_conversions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.unit_conversions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.unit_conversions;

CREATE POLICY "Staff can insert unit conversions"
  ON public.unit_conversions FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can update unit conversions"
  ON public.unit_conversions FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Staff can delete unit conversions"
  ON public.unit_conversions FOR DELETE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== role_permissions =====
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='role_permissions' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.role_permissions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins and managers can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- ===== STORAGE: drop overpermissive policies =====
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view expense receipts" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload frontend assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update frontend assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete frontend assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload frontend assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update frontend assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete frontend assets" ON storage.objects;

CREATE POLICY "Staff can upload frontend assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'frontend-assets'
    AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role])
  );

CREATE POLICY "Staff can update frontend assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'frontend-assets'
    AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role])
  );

CREATE POLICY "Staff can delete frontend assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'frontend-assets'
    AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role])
  );
