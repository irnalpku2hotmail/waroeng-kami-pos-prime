-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Update RLS policy for transactions table to allow staff to view all transactions
DROP POLICY IF EXISTS "Staff can view all transactions" ON public.transactions;
CREATE POLICY "Staff can view all transactions"
ON public.transactions
FOR SELECT
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
);

-- Update RLS policy for transaction_items table to allow staff to view all transaction items
DROP POLICY IF EXISTS "Staff can view all transaction items" ON public.transaction_items;
CREATE POLICY "Staff can view all transaction items"
ON public.transaction_items
FOR SELECT
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
);

-- Create function to get similar products using pg_trgm
CREATE OR REPLACE FUNCTION public.get_similar_products(
  search_term TEXT,
  category_filter UUID DEFAULT NULL,
  similarity_threshold REAL DEFAULT 0.3,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  selling_price NUMERIC,
  current_stock INTEGER,
  image_url TEXT,
  category_id UUID,
  similarity_score REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.selling_price,
    p.current_stock,
    p.image_url,
    p.category_id,
    similarity(p.name, search_term) as similarity_score
  FROM public.products p
  WHERE 
    p.is_active = true
    AND similarity(p.name, search_term) > similarity_threshold
    AND (category_filter IS NULL OR p.category_id = category_filter)
  ORDER BY similarity_score DESC
  LIMIT max_results;
END;
$$;