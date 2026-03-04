
-- Create storage bucket for bundle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('bundle-images', 'bundle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view bundle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bundle-images');

-- Allow authenticated staff to upload
CREATE POLICY "Staff can upload bundle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bundle-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated staff to update
CREATE POLICY "Staff can update bundle images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bundle-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated staff to delete
CREATE POLICY "Staff can delete bundle images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bundle-images' 
  AND auth.role() = 'authenticated'
);
