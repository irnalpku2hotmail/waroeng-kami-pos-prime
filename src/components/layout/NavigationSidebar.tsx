import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Settings,
  CreditCard,
  Package2,
  UserCheck,
  Gift,
  FileText,
  Truck,
  RotateCcw,
  DollarSign,
  Home,
  Calendar,
  Bell,
  MapPin,
  Shield
} from 'lucide-react';

const NavigationSidebar = () => {
  const { profile } = useAuth();
  const location = useLocation();

  // Fetch role permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['role-permissions', profile?.role],
    queryFn: async () => {
      if (!profile?.role) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', profile.role as string);
      
      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.role
  });

  const hasPermission = (resource: string): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(p => p.resource === resource && p.can_read === true);
  };

  const menuItems = [
    { 
      icon: Home, 
      label: 'Frontend', 
      path: '/', 
      permission: null,
      roles: ['admin', 'manager', 'staff', 'cashier', 'buyer']
    },
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard', 
      permission: 'dashboard',
      roles: ['admin', 'manager', 'staff', 'cashier']
    },
    { 
      icon: Package, 
      label: 'Products', 
      path: '/products', 
      permission: 'products',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: Package2, 
      label: 'Categories & Units', 
      path: '/categories-units', 
      permission: 'categories',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: ShoppingCart, 
      label: 'POS', 
      path: '/pos', 
      permission: 'transactions',
      roles: ['admin', 'manager', 'staff', 'cashier']
    },
    { 
      icon: FileText, 
      label: 'Orders', 
      path: '/orders', 
      permission: 'orders',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: Calendar, 
      label: 'Order History', 
      path: '/order-history', 
      permission: 'orders',
      roles: ['admin', 'manager', 'staff', 'buyer']
    },
    { 
      icon: Users, 
      label: 'Customers', 
      path: '/customers', 
      permission: 'customers',
      roles: ['admin', 'manager', 'staff', 'cashier']
    },
    { 
      icon: CreditCard, 
      label: 'Credit Management', 
      path: '/credit-management', 
      permission: 'credit',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: TrendingUp, 
      label: 'Inventory', 
      path: '/inventory', 
      permission: 'inventory',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: Truck, 
      label: 'Purchases', 
      path: '/purchases', 
      permission: 'purchases',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: RotateCcw, 
      label: 'Returns', 
      path: '/returns', 
      permission: 'returns',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: DollarSign, 
      label: 'Expenses', 
      path: '/expenses', 
      permission: 'expenses',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: Truck, 
      label: 'Suppliers', 
      path: '/suppliers', 
      permission: 'suppliers',
      roles: ['admin', 'manager', 'staff']
    },
    { 
      icon: FileText, 
      label: 'Reports', 
      path: '/reports', 
      permission: 'reports',
      roles: ['admin', 'manager']
    },
    { 
      icon: Gift, 
      label: 'Points & Rewards', 
      path: '/points-rewards', 
      permission: 'rewards',
      roles: ['admin', 'manager', 'staff', 'cashier']
    },
    { 
      icon: Gift, 
      label: 'Point Exchange', 
      path: '/point-exchange', 
      permission: 'rewards',
      roles: ['admin', 'manager', 'staff', 'cashier']
    },
    { 
      icon: TrendingUp, 
      label: 'Flash Sales', 
      path: '/flash-sales', 
      permission: 'flash_sales',
      roles: ['admin', 'manager']
    },
    { 
      icon: UserCheck, 
      label: 'User Management', 
      path: '/user-management', 
      permission: 'users',
      roles: ['admin']
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      path: '/notifications', 
      permission: null,
      roles: ['admin', 'manager', 'staff', 'cashier', 'buyer']
    },
    { 
      icon: MapPin, 
      label: 'User Locations', 
      path: '/user-locations', 
      permission: 'users',
      roles: ['admin', 'manager']
    },
    { 
      icon: Shield, 
      label: 'Security', 
      path: '/security', 
      permission: 'security',
      roles: ['admin']
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings', 
      permission: 'settings',
      roles: ['admin', 'manager']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // Check if user role is allowed for this menu item
    if (!item.roles.includes(profile?.role || '')) {
      return false;
    }
    
    // Check permission if required
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">TokoQu</h2>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={index}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150",
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default NavigationSidebar;
