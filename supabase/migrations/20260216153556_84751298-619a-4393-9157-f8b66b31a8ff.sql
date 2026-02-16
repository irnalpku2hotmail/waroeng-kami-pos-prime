
-- Allow public (unauthenticated) access to products
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
CREATE POLICY "Everyone can view products" ON public.products
  FOR SELECT USING (true);

-- Allow public (unauthenticated) access to categories
DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories;
CREATE POLICY "Everyone can view categories" ON public.categories
  FOR SELECT USING (true);

-- Allow public access to product_reviews (already true, but ensure consistency)
-- Already has true policy

-- Allow public access to price_history (already true)
-- Already has true policy

-- Allow public access to user_product_likes for guest browsing (read only)
-- Currently no public SELECT policy exists, let's check and add if needed
