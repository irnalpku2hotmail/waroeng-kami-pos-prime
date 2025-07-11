
-- Fix user deletion by ensuring proper RLS policies and cascade deletions
-- Update profiles table to handle user deletion properly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create user_locations table for location access feature
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Indonesia',
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_locations
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_locations
CREATE POLICY "Users can view their own locations" 
  ON public.user_locations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" 
  ON public.user_locations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" 
  ON public.user_locations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" 
  ON public.user_locations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_user_locations_updated_at
  BEFORE UPDATE ON public.user_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Improve user deletion policies for profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_is_primary ON public.user_locations(user_id, is_primary) WHERE is_primary = true;
