-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for expense receipts bucket
CREATE POLICY "Authenticated users can upload expense receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts');

CREATE POLICY "Users can view expense receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'expense-receipts');

CREATE POLICY "Users can delete expense receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'expense-receipts');