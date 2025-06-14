
-- Create storage bucket for category icons (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Create specific policies for category icons bucket
CREATE POLICY "Category icons public read access" ON storage.objects FOR SELECT USING (bucket_id = 'category-icons');
CREATE POLICY "Category icons authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-icons' AND auth.role() = 'authenticated');
CREATE POLICY "Category icons authenticated update" ON storage.objects FOR UPDATE USING (bucket_id = 'category-icons' AND auth.role() = 'authenticated');
CREATE POLICY "Category icons authenticated delete" ON storage.objects FOR DELETE USING (bucket_id = 'category-icons' AND auth.role() = 'authenticated');

-- Add icon_url column to categories table (only if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon_url') THEN
        ALTER TABLE public.categories ADD COLUMN icon_url TEXT;
    END IF;
END $$;

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 10000,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled')),
  notes TEXT,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM orders
  WHERE order_number LIKE 'ORD%';
  
  order_num := 'ORD' || LPAD(next_num::TEXT, 6, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Create function to update product stock when order is delivered
CREATE OR REPLACE FUNCTION update_stock_on_order_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Update stock for all order items
    UPDATE public.products 
    SET current_stock = current_stock - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND products.id = oi.product_id;
  -- If status changes from 'delivered' to something else, restore stock
  ELSIF OLD.status = 'delivered' AND NEW.status != 'delivered' THEN
    UPDATE public.products 
    SET current_stock = current_stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND products.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_order_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_order_delivery();

-- Add COD settings to settings table
INSERT INTO public.settings (key, value) 
VALUES ('cod_settings', '{"enabled": true, "delivery_fee": 10000, "max_distance": 10, "min_order": 50000}')
ON CONFLICT (key) DO NOTHING;
