
-- Create storage bucket for website assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-assets', 'website-assets', true);

-- Create policies for website-assets bucket
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'website-assets');

CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'website-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" ON storage.objects
FOR UPDATE USING (bucket_id = 'website-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" ON storage.objects
FOR DELETE USING (bucket_id = 'website-assets' AND auth.role() = 'authenticated');

-- Create website_settings table
CREATE TABLE public.website_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  navbar_color TEXT NOT NULL DEFAULT '#1f2937',
  footer_color TEXT NOT NULL DEFAULT '#1f2937',
  favicon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create website_banners table for multiple banner uploads
CREATE TABLE public.website_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_banners ENABLE ROW LEVEL SECURITY;

-- Create policies for website_settings
CREATE POLICY "Allow public read access for website_settings" 
  ON public.website_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to manage website_settings" 
  ON public.website_settings 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Create policies for website_banners
CREATE POLICY "Allow public read access for website_banners" 
  ON public.website_banners 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to manage website_banners" 
  ON public.website_banners 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Insert default website settings
INSERT INTO public.website_settings (navbar_color, footer_color)
VALUES ('#1f2937', '#1f2937');
