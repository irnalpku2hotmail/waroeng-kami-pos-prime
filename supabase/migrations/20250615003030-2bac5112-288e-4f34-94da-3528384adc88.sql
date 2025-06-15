
-- Create storage bucket for frontend assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('frontend-assets', 'frontend-assets', true);

-- Create RLS policies for the frontend-assets bucket
CREATE POLICY "Anyone can view frontend assets" ON storage.objects
FOR SELECT USING (bucket_id = 'frontend-assets');

CREATE POLICY "Authenticated users can upload frontend assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'frontend-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update frontend assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'frontend-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete frontend assets" ON storage.objects
FOR DELETE USING (bucket_id = 'frontend-assets' AND auth.role() = 'authenticated');
