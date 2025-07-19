
-- Create product_reviews table for storing product reviews and ratings
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create user_product_likes table for product likes/favorites
CREATE TABLE IF NOT EXISTS public.user_product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Add updated_at trigger for product_reviews
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_reviews_updated_at 
    BEFORE UPDATE ON product_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_reviews
CREATE POLICY "Users can view all reviews" ON public.product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for purchased products" ON public.product_reviews
    FOR INSERT WITH CHECK (
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

CREATE POLICY "Users can update their own reviews" ON public.product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.product_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for user_product_likes
ALTER TABLE public.user_product_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_product_likes
CREATE POLICY "Users can view their own product likes" ON public.user_product_likes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product likes" ON public.user_product_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product likes" ON public.user_product_likes
    FOR DELETE USING (auth.uid() = user_id);
