
-- Create product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Add RLS policies for product reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view all reviews
CREATE POLICY "Users can view all reviews" 
  ON public.product_reviews 
  FOR SELECT 
  USING (true);

-- Users can only create reviews for products they have purchased
CREATE POLICY "Users can create reviews for purchased products" 
  ON public.product_reviews 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.customer_id = (
        SELECT id FROM customers 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
      AND oi.product_id = product_reviews.product_id
      AND o.status = 'delivered'
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" 
  ON public.product_reviews 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
  ON public.product_reviews 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create product brands table for brand carousel
CREATE TABLE public.product_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for product brands
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;

-- Everyone can view active brands
CREATE POLICY "Everyone can view active brands" 
  ON public.product_brands 
  FOR SELECT 
  USING (is_active = true);

-- Staff can manage brands
CREATE POLICY "Staff can manage brands" 
  ON public.product_brands 
  FOR ALL 
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

-- Add brand_id to products table
ALTER TABLE public.products ADD COLUMN brand_id UUID REFERENCES public.product_brands(id);

-- Add trigger for updated_at on brands
CREATE TRIGGER update_product_brands_updated_at
  BEFORE UPDATE ON public.product_brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
