
-- Update database schema dengan perbaikan dan penambahan yang diperlukan

-- 1. Pastikan function get_user_role ada dan berfungsi dengan baik
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tambahkan function untuk generate customer code otomatis
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  customer_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM customers
  WHERE customer_code LIKE 'CST%';
  
  customer_code := 'CST' || LPAD(next_num::TEXT, 6, '0');
  RETURN customer_code;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger untuk auto-generate customer code
CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code := generate_customer_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_customer_code ON customers;
CREATE TRIGGER trigger_set_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_code();

-- 4. Perbaiki RLS policies untuk user management
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" 
  ON profiles 
  FOR DELETE 
  USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" 
  ON profiles 
  FOR UPDATE 
  USING (get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);

-- 5. Tambahkan index untuk performa pagination
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- 6. Update settings table dengan data default untuk frontend
INSERT INTO settings (key, value) VALUES 
('frontend_settings', '{
  "carousel_autoplay": true,
  "carousel_interval": 5000,
  "categories_per_row": 4,
  "products_per_page": 12
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 7. Pastikan semua tabel memiliki updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers ke tabel yang belum ada
DO $$
DECLARE
    table_name TEXT;
    tables_to_update TEXT[] := ARRAY['products', 'categories', 'customers', 'suppliers', 'units', 'profiles'];
BEGIN
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', table_name, table_name);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW 
                       EXECUTE FUNCTION update_updated_at_column()', table_name, table_name);
    END LOOP;
END $$;
