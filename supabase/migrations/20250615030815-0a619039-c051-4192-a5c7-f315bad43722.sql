
-- Create storage bucket for frontend assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'frontend-assets', 'frontend-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'frontend-assets');

-- Create storage policies for frontend assets
DROP POLICY IF EXISTS "Anyone can view frontend assets" ON storage.objects;
CREATE POLICY "Anyone can view frontend assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'frontend-assets');

DROP POLICY IF EXISTS "Users can upload frontend assets" ON storage.objects;
CREATE POLICY "Users can upload frontend assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'frontend-assets');

DROP POLICY IF EXISTS "Users can update frontend assets" ON storage.objects;
CREATE POLICY "Users can update frontend assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'frontend-assets');

DROP POLICY IF EXISTS "Users can delete frontend assets" ON storage.objects;
CREATE POLICY "Users can delete frontend assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'frontend-assets');
