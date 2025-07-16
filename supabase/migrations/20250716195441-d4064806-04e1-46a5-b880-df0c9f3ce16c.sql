
-- Create table for role permissions
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, resource)
);

-- Add location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC,
ADD COLUMN address_text TEXT,
ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE;

-- Enable Row Level Security for role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role_permissions
CREATE POLICY "Admins can manage role permissions" 
  ON public.role_permissions 
  FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Everyone can view role permissions" 
  ON public.role_permissions 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Insert default permissions for each role
INSERT INTO public.role_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
-- Admin permissions (full access)
('admin', 'products', true, true, true, true),
('admin', 'categories', true, true, true, true),
('admin', 'users', true, true, true, true),
('admin', 'orders', true, true, true, true),
('admin', 'reports', true, true, true, true),
('admin', 'settings', true, true, true, true),

-- Manager permissions
('manager', 'products', true, true, true, true),
('manager', 'categories', true, true, true, false),
('manager', 'users', false, true, true, false),
('manager', 'orders', true, true, true, false),
('manager', 'reports', false, true, false, false),
('manager', 'settings', false, true, true, false),

-- Staff permissions
('staff', 'products', true, true, true, false),
('staff', 'categories', false, true, false, false),
('staff', 'users', false, true, false, false),
('staff', 'orders', true, true, true, false),
('staff', 'reports', false, true, false, false),
('staff', 'settings', false, true, false, false),

-- Cashier permissions
('cashier', 'products', false, true, false, false),
('cashier', 'categories', false, true, false, false),
('cashier', 'users', false, true, false, false),
('cashier', 'orders', true, true, true, false),
('cashier', 'reports', false, true, false, false),
('cashier', 'settings', false, true, false, false),

-- Buyer permissions (customers)
('buyer', 'products', false, true, false, false),
('buyer', 'categories', false, true, false, false),
('buyer', 'users', false, false, false, false),
('buyer', 'orders', true, true, false, false),
('buyer', 'reports', false, false, false, false),
('buyer', 'settings', false, false, false, false);

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
  user_id UUID,
  resource_name TEXT,
  permission_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_val user_role;
  has_permission BOOLEAN := false;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM profiles WHERE id = user_id;
  
  -- Check permission based on type
  SELECT 
    CASE permission_type
      WHEN 'create' THEN can_create
      WHEN 'read' THEN can_read
      WHEN 'update' THEN can_update
      WHEN 'delete' THEN can_delete
      ELSE false
    END
  INTO has_permission
  FROM role_permissions 
  WHERE role = user_role_val AND resource = resource_name;
  
  RETURN COALESCE(has_permission, false);
END;
$$;
