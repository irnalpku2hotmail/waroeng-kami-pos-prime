
-- Create user_product_likes table for storing user likes on products
CREATE TABLE public.user_product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_product_likes ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own likes
CREATE POLICY "Users can view their own product likes" 
  ON public.user_product_likes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to create their own likes
CREATE POLICY "Users can create their own product likes" 
  ON public.user_product_likes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to delete their own likes
CREATE POLICY "Users can delete their own product likes" 
  ON public.user_product_likes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_user_product_likes_user_id ON public.user_product_likes(user_id);
CREATE INDEX idx_user_product_likes_product_id ON public.user_product_likes(product_id);
