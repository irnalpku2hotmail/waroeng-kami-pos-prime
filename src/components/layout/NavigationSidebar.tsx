
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

interface NavigationSidebarProps {
  onLinkClick?: () => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ onLinkClick }) => {
  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'POS', path: '/pos', icon: ShoppingCart },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Categories & Units', path: '/categories', icon: Archive },
    { name: 'Inventory', path: '/inventory', icon: TrendingUp },
    { name: 'Orders', path: '/orders', icon: FileText },
    { name: 'Purchases', path: '/purchases', icon: Truck },
    { name: 'Returns', path: '/returns', icon: Archive },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Credit Management', path: '/credit-management', icon: CreditCard },
    { name: 'User Management', path: '/user-management', icon: UserCheck },
    { name: 'User Locations', path: '/user-locations', icon: MapPin },
    { name: 'Point Exchange', path: '/point-exchange', icon: Star },
    { name: 'Points & Rewards', path: '/points-rewards', icon: Star },
    { name: 'Flash Sales', path: '/flash-sales', icon: Zap },
    { name: 'Expenses', path: '/expenses', icon: FileText },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLinkClick = (e: React.MouseEvent) => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 [&.active]:bg-blue-100 [&.active]:text-blue-800"
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
