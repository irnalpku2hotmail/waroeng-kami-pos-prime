
-- Add new resources to role_permissions table
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
-- POS permissions
('admin', 'pos', true, true, true, true),
('manager', 'pos', true, true, true, false),
('staff', 'pos', true, true, true, false),
('cashier', 'pos', true, true, false, false),
('buyer', 'pos', false, false, false, false),

-- Inventory permissions  
('admin', 'inventory', true, true, true, true),
('manager', 'inventory', true, true, true, false),
('staff', 'inventory', false, true, true, false),
('cashier', 'inventory', false, true, false, false),
('buyer', 'inventory', false, false, false, false),

-- Purchases permissions
('admin', 'purchases', true, true, true, true),
('manager', 'purchases', true, true, true, false),
('staff', 'purchases', true, true, true, false),
('cashier', 'purchases', false, true, false, false),
('buyer', 'purchases', false, false, false, false),

-- Returns permissions
('admin', 'returns', true, true, true, true),
('manager', 'returns', true, true, true, false),
('staff', 'returns', true, true, true, false),
('cashier', 'returns', false, true, false, false),
('buyer', 'returns', false, false, false, false),

-- Suppliers permissions
('admin', 'suppliers', true, true, true, true),
('manager', 'suppliers', true, true, true, false),
('staff', 'suppliers', false, true, false, false),
('cashier', 'suppliers', false, true, false, false),
('buyer', 'suppliers', false, false, false, false),

-- Customers permissions
('admin', 'customers', true, true, true, true),
('manager', 'customers', true, true, true, false),
('staff', 'customers', true, true, true, false),
('cashier', 'customers', true, true, false, false),
('buyer', 'customers', false, false, false, false),

-- Expenses permissions
('admin', 'expenses', true, true, true, true),
('manager', 'expenses', true, true, true, false),
('staff', 'expenses', true, true, true, false),
('cashier', 'expenses', false, true, false, false),
('buyer', 'expenses', false, false, false, false),

-- Credit Management permissions
('admin', 'credit-management', true, true, true, true),
('manager', 'credit-management', true, true, true, false),
('staff', 'credit-management', false, true, true, false),
('cashier', 'credit-management', false, true, false, false),
('buyer', 'credit-management', false, false, false, false),

-- Point Exchange permissions
('admin', 'point-exchange', true, true, true, true),
('manager', 'point-exchange', true, true, true, false),
('staff', 'point-exchange', true, true, true, false),
('cashier', 'point-exchange', true, true, false, false),
('buyer', 'point-exchange', false, false, false, false),

-- Points Rewards permissions
('admin', 'points-rewards', true, true, true, true),
('manager', 'points-rewards', true, true, true, false),
('staff', 'points-rewards', false, true, false, false),
('cashier', 'points-rewards', false, true, false, false),
('buyer', 'points-rewards', false, true, false, false),

-- Flash Sales permissions
('admin', 'flash-sales', true, true, true, true),
('manager', 'flash-sales', true, true, true, false),
('staff', 'flash-sales', false, true, false, false),
('cashier', 'flash-sales', false, true, false, false),
('buyer', 'flash-sales', false, true, false, false),

-- User Locations permissions
('admin', 'user-locations', true, true, true, true),
('manager', 'user-locations', true, true, true, false),
('staff', 'user-locations', false, true, false, false),
('cashier', 'user-locations', false, true, false, false),
('buyer', 'user-locations', false, true, false, false)
ON CONFLICT (role, resource) DO UPDATE SET
  can_create = EXCLUDED.can_create,
  can_read = EXCLUDED.can_read,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  updated_at = now();
