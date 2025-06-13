
-- Add invoice_number and payment_method to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS due_date date;

-- Add constraint for payment_method if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'purchases_payment_method_check' 
    AND table_name = 'purchases'
  ) THEN
    ALTER TABLE public.purchases 
    ADD CONSTRAINT purchases_payment_method_check 
    CHECK (payment_method IN ('cash', 'credit'));
  END IF;
END $$;

-- Add expiration_date to purchase_items table
ALTER TABLE public.purchase_items
ADD COLUMN IF NOT EXISTS expiration_date date;

-- Add invoice_number and status to returns table
ALTER TABLE public.returns
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'process';

-- Add constraint for returns status if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'returns_status_check' 
    AND table_name = 'returns'
  ) THEN
    ALTER TABLE public.returns 
    ADD CONSTRAINT returns_status_check 
    CHECK (status IN ('process', 'success'));
  END IF;
END $$;

-- Create storage bucket for expense receipts if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'expense-receipts', 'expense-receipts', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'expense-receipts');

-- Create storage bucket for banners if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners');

-- Create storage policies for expense receipts (drop if exists, then create)
DROP POLICY IF EXISTS "Users can upload expense receipts" ON storage.objects;
CREATE POLICY "Users can upload expense receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their expense receipts" ON storage.objects;
CREATE POLICY "Users can view their expense receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their expense receipts" ON storage.objects;
CREATE POLICY "Users can delete their expense receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for banners
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners');

DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;
CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;
CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners');

-- Create trigger for returns to update stock when status is 'success'
CREATE OR REPLACE FUNCTION update_stock_on_return_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'success'
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    -- Update stock for all return items
    UPDATE public.products 
    SET current_stock = current_stock - ri.quantity
    FROM public.return_items ri
    WHERE ri.return_id = NEW.id AND products.id = ri.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_return_status ON public.returns;
CREATE TRIGGER trigger_update_stock_on_return_status
  AFTER UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_return_status();

-- Create trigger to automatically set due_date for credit purchases
CREATE OR REPLACE FUNCTION set_credit_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'credit' AND NEW.due_date IS NULL THEN
    NEW.due_date = NEW.purchase_date + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_credit_due_date ON public.purchases;
CREATE TRIGGER trigger_set_credit_due_date
  BEFORE INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION set_credit_due_date();
