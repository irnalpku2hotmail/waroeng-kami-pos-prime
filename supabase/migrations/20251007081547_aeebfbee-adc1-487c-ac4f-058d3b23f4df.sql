-- Create search_analytics table to track user searches
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  category_filter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view all search analytics"
  ON public.search_analytics
  FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

CREATE POLICY "Users can create their own search analytics"
  ON public.search_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_search_analytics_query ON public.search_analytics(search_query);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at DESC);
CREATE INDEX idx_search_analytics_user_id ON public.search_analytics(user_id);