
import React from 'react';
import { NavLink } from 'react-router-dom';
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
import { usePermissions } from '@/hooks/usePermissions';

interface NavigationSidebarProps {
  onLinkClick?: () => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ onLinkClick }) => {
  const { canAccessRoute } = usePermissions();

  const menuItems = [
    { name: 'Home', path: '/', icon: Home, resource: 'dashboard' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, resource: 'dashboard' },
    { name: 'POS', path: '/pos', icon: ShoppingCart, resource: 'pos' },
    { name: 'Products', path: '/products', icon: Package, resource: 'products' },
    { name: 'Categories', path: '/categories', icon: Archive, resource: 'categories' },
    { name: 'Units', path: '/units', icon: Archive, resource: 'categories' },
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
  const allowedMenuItems = menuItems.filter(item => canAccessRoute(item.resource));

  return (
    <nav className="space-y-2">
      {allowedMenuItems.map((item) => {
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
