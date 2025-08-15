
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  CreditCard,
  UserCheck,
  MapPin,
  Truck,
  FileText,
  Star,
  Zap,
  Archive,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

interface NavigationSidebarProps {
  onLinkClick?: () => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ onLinkClick }) => {
  const { profile } = useAuth();

  // Fetch user permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['user-permissions', profile?.role],
    queryFn: async () => {
      if (!profile?.role) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', profile.role);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.role
  });

  // Check if user has permission for a resource
  const hasPermission = (resource: string, action: 'read' | 'create' | 'update' | 'delete' = 'read') => {
    if (!permissions.length) return false;
    
    const permission = permissions.find(p => p.resource === resource);
    if (!permission) return false;
    
    switch (action) {
      case 'read': return permission.can_read;
      case 'create': return permission.can_create;
      case 'update': return permission.can_update;
      case 'delete': return permission.can_delete;
      default: return false;
    }
  };

  const allMenuItems = [
    { name: 'Home', path: '/', icon: Home, resource: null }, // Always visible
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, resource: 'reports' },
    { name: 'POS', path: '/pos', icon: ShoppingCart, resource: 'pos' },
    { name: 'Products', path: '/products', icon: Package, resource: 'products' },
    { name: 'Categories & Units', path: '/categories', icon: Archive, resource: 'categories' },
    { name: 'Inventory', path: '/inventory', icon: TrendingUp, resource: 'inventory' },
    { name: 'Orders', path: '/orders', icon: FileText, resource: 'orders' },
    { name: 'Purchases', path: '/purchases', icon: Truck, resource: 'purchases' },
    { name: 'Returns', path: '/returns', icon: Archive, resource: 'returns' },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, resource: 'suppliers' },
    { name: 'Customers', path: '/customers', icon: Users, resource: 'customers' },
    { name: 'Credit Management', path: '/credit-management', icon: CreditCard, resource: 'credit-management' },
    { name: 'User Management', path: '/user-management', icon: UserCheck, resource: 'users' },
    { name: 'User Locations', path: '/user-locations', icon: MapPin, resource: 'user-locations' },
    { name: 'Point Exchange', path: '/point-exchange', icon: Star, resource: 'point-exchange' },
    { name: 'Points & Rewards', path: '/points-rewards', icon: Star, resource: 'points-rewards' },
    { name: 'Flash Sales', path: '/flash-sales', icon: Zap, resource: 'flash-sales' },
    { name: 'Expenses', path: '/expenses', icon: FileText, resource: 'expenses' },
    { name: 'Reports', path: '/reports', icon: BarChart3, resource: 'reports' },
    { name: 'Settings', path: '/settings', icon: Settings, resource: 'settings' },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => {
    // Always show Home
    if (!item.resource) return true;
    
    // Check if user has read permission for the resource
    return hasPermission(item.resource, 'read');
  });

  return (
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default NavigationSidebar;
