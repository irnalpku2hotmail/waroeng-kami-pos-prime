-- 1. Inventory statistics
CREATE OR REPLACE FUNCTION public.get_inventory_statistics()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_products', COUNT(*),
    'low_stock_count', COUNT(*) FILTER (WHERE current_stock <= min_stock),
    'total_stock_value', COALESCE(SUM(current_stock::numeric * base_price), 0)
  )
  FROM public.products
  WHERE is_active = true;
$$;

-- 2. Low stock products (server-side column comparison)
CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  name text,
  barcode text,
  image_url text,
  current_stock integer,
  min_stock integer,
  selling_price numeric,
  unit_name text,
  category_name text,
  total_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH low AS (
    SELECT p.id, p.name, p.barcode, p.image_url, p.current_stock, p.min_stock, p.selling_price,
           u.name AS unit_name, c.name AS category_name
    FROM public.products p
    LEFT JOIN public.units u ON u.id = p.unit_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.is_active = true AND p.current_stock <= p.min_stock
  )
  SELECT l.*, (SELECT COUNT(*) FROM low) AS total_count
  FROM low l
  ORDER BY l.current_stock ASC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

-- 3. Expense statistics
CREATE OR REPLACE FUNCTION public.get_expense_statistics(p_start_date date DEFAULT NULL, p_end_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_expenses', COUNT(*),
    'total_amount', COALESCE(SUM(amount), 0),
    'period_amount', COALESCE(SUM(amount) FILTER (
      WHERE (p_start_date IS NULL OR expense_date >= p_start_date)
        AND (p_end_date IS NULL OR expense_date <= p_end_date)
    ), 0)
  )
  FROM public.expenses;
$$;

-- 4. Customer points statistics
CREATE OR REPLACE FUNCTION public.get_customer_points_statistics()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_customers', COUNT(*),
    'total_points', COALESCE(SUM(total_points), 0),
    'average_points', COALESCE(ROUND(AVG(total_points), 2), 0)
  )
  FROM public.customers;
$$;

-- 5. Flash sale statistics
CREATE OR REPLACE FUNCTION public.get_flash_sale_statistics(p_flash_sale_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_available', (
      SELECT COUNT(*) FROM public.flash_sales fs
      WHERE fs.is_active = true
        AND (p_flash_sale_id IS NULL OR fs.id = p_flash_sale_id)
    ),
    'total_available_value', COALESCE(SUM(fsi.stock_quantity::numeric * fsi.sale_price), 0),
    'total_sales_value', COALESCE(SUM(fsi.sold_quantity::numeric * fsi.sale_price), 0)
  )
  FROM public.flash_sale_items fsi
  JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
  WHERE fs.is_active = true
    AND (p_flash_sale_id IS NULL OR fsi.flash_sale_id = p_flash_sale_id);
$$;

-- 6. Customer summaries (aggregation per customer, no browser reduce)
CREATE OR REPLACE FUNCTION public.get_customer_summaries(p_customer_ids uuid[])
RETURNS TABLE(customer_id uuid, total_spent numeric, total_orders bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH ids AS (
    SELECT DISTINCT unnest(COALESCE(p_customer_ids, ARRAY[]::uuid[])) AS id
  ),
  tx AS (
    SELECT t.customer_id, COALESCE(SUM(t.total_amount), 0) AS spent, COUNT(*) AS cnt
    FROM public.transactions t
    WHERE t.customer_id IN (SELECT id FROM ids)
    GROUP BY t.customer_id
  ),
  ord AS (
    SELECT o.customer_id,
           COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS spent,
           COUNT(*) AS cnt
    FROM public.orders o
    WHERE o.customer_id IN (SELECT id FROM ids)
    GROUP BY o.customer_id
  )
  SELECT ids.id,
         COALESCE(tx.spent, 0) + COALESCE(ord.spent, 0),
         COALESCE(tx.cnt, 0) + COALESCE(ord.cnt, 0)
  FROM ids
  LEFT JOIN tx ON tx.customer_id = ids.id
  LEFT JOIN ord ON ord.customer_id = ids.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_products(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_statistics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_points_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_flash_sale_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_summaries(uuid[]) TO authenticated;

-- Security fix: restrict storefront asset buckets to staff roles
DROP POLICY IF EXISTS "Staff can upload bundle images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update bundle images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete bundle images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;
DROP POLICY IF EXISTS "Category icons authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Category icons authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Category icons authenticated delete" ON storage.objects;

CREATE POLICY "Staff can upload storefront assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('bundle-images', 'website-assets', 'category-icons')
    AND public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
  );

CREATE POLICY "Staff can update storefront assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('bundle-images', 'website-assets', 'category-icons')
    AND public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
  );

CREATE POLICY "Staff can delete storefront assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('bundle-images', 'website-assets', 'category-icons')
    AND public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
  );