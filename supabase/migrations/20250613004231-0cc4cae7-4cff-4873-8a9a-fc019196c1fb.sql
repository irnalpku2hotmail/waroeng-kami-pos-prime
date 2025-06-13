
-- Create storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images');

-- Create storage policies for product images
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
CREATE POLICY "Users can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
CREATE POLICY "Users can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- Remove old price variant columns from products table and update pricing structure
ALTER TABLE public.products 
DROP COLUMN IF EXISTS tier1_quantity,
DROP COLUMN IF EXISTS tier1_price,
DROP COLUMN IF EXISTS tier2_quantity,
DROP COLUMN IF EXISTS tier2_price,
DROP COLUMN IF EXISTS tier3_quantity,
DROP COLUMN IF EXISTS tier3_price;

-- Update price_variants table to be more flexible
ALTER TABLE public.price_variants
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update unit_conversions to reference units table
ALTER TABLE public.unit_conversions
DROP COLUMN IF EXISTS from_unit,
DROP COLUMN IF EXISTS to_unit,
ADD COLUMN IF NOT EXISTS from_unit_id uuid REFERENCES public.units(id),
ADD COLUMN IF NOT EXISTS to_unit_id uuid REFERENCES public.units(id);

-- Add foreign key constraints that were missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_category_id_fkey' 
    AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.categories(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_unit_id_fkey' 
    AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_unit_id_fkey 
    FOREIGN KEY (unit_id) REFERENCES public.units(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_supplier_id_fkey' 
    AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'price_variants_product_id_fkey' 
    AND table_name = 'price_variants'
  ) THEN
    ALTER TABLE public.price_variants 
    ADD CONSTRAINT price_variants_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unit_conversions_product_id_fkey' 
    AND table_name = 'unit_conversions'
  ) THEN
    ALTER TABLE public.unit_conversions 
    ADD CONSTRAINT unit_conversions_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add QR code URL to customers table for member cards
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS qr_code_url text;

-- Create function to get customer purchase history
CREATE OR REPLACE FUNCTION get_customer_purchase_history(customer_uuid uuid)
RETURNS TABLE (
  transaction_id uuid,
  transaction_number text,
  total_amount numeric,
  points_earned integer,
  points_used integer,
  created_at timestamp with time zone,
  items jsonb
) AS $$
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
  FROM transactions t
  LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
  LEFT JOIN products p ON ti.product_id = p.id
  WHERE t.customer_id = customer_uuid
  GROUP BY t.id, t.transaction_number, t.total_amount, t.points_earned, t.points_used, t.created_at
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get supplier purchase history
CREATE OR REPLACE FUNCTION get_supplier_purchase_history(supplier_uuid uuid)
RETURNS TABLE (
  purchase_id uuid,
  purchase_number text,
  total_amount numeric,
  purchase_date date,
  payment_method text,
  status text,
  created_at timestamp with time zone,
  items jsonb
) AS $$
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
  FROM purchases p
  LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
  LEFT JOIN products pr ON pi.product_id = pr.id
  WHERE p.supplier_id = supplier_uuid
  GROUP BY p.id, p.purchase_number, p.total_amount, p.purchase_date, p.payment_method, p.created_at
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get supplier return history
CREATE OR REPLACE FUNCTION get_supplier_return_history(supplier_uuid uuid)
RETURNS TABLE (
  return_id uuid,
  return_number text,
  total_amount numeric,
  return_date date,
  status text,
  reason text,
  created_at timestamp with time zone,
  items jsonb
) AS $$
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
  FROM returns r
  LEFT JOIN return_items ri ON r.id = ri.return_id
  LEFT JOIN products p ON ri.product_id = p.id
  WHERE r.supplier_id = supplier_uuid
  GROUP BY r.id, r.return_number, r.total_amount, r.return_date, r.status, r.reason, r.created_at
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
