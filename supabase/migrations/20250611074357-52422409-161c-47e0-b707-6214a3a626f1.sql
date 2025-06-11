
-- Create price_variants table for product price variants
CREATE TABLE public.price_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  minimum_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unit_conversions table for product unit conversions
CREATE TABLE public.unit_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  conversion_factor NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_items table for product rewards
CREATE TABLE public.reward_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flash_sales table
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flash_sale_items table
CREATE TABLE public.flash_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flash_sale_id UUID NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  original_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  max_quantity_per_customer INTEGER,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.price_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for price_variants
CREATE POLICY "Enable read access for all users" ON public.price_variants FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.price_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.price_variants FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.price_variants FOR DELETE USING (true);

-- Create RLS policies for unit_conversions
CREATE POLICY "Enable read access for all users" ON public.unit_conversions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.unit_conversions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.unit_conversions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.unit_conversions FOR DELETE USING (true);

-- Create RLS policies for reward_items
CREATE POLICY "Enable read access for all users" ON public.reward_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.reward_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.reward_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.reward_items FOR DELETE USING (true);

-- Create RLS policies for flash_sales
CREATE POLICY "Enable read access for all users" ON public.flash_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.flash_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.flash_sales FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.flash_sales FOR DELETE USING (true);

-- Create RLS policies for flash_sale_items
CREATE POLICY "Enable read access for all users" ON public.flash_sale_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.flash_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.flash_sale_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.flash_sale_items FOR DELETE USING (true);

-- Create RLS policies for settings
CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.settings FOR DELETE USING (true);

-- Remove member_card_url column from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS member_card_url;

-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for banners bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Authenticated users can upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');
