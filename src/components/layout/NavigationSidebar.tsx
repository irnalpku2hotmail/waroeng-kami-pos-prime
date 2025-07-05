import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  CreditCard,
  Gift,
  Truck,
  RotateCcw,
  ShoppingBag,
  Archive,
  UserCheck,
  Megaphone,
  Store
} from 'lucide-react';

interface NavigationSidebarProps {
  onLinkClick?: () => void;
}

const NavigationSidebar = ({ onLinkClick }: NavigationSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingCart, label: 'POS', path: '/pos' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Archive, label: 'Categories & Units', path: '/categories-units' },
    { icon: ShoppingBag, label: 'Purchases', path: '/purchases' },
    { icon: RotateCcw, label: 'Returns', path: '/returns' },
    { icon: Truck, label: 'Orders', path: '/orders' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: CreditCard, label: 'Credit Management', path: '/credit-management' },
    { icon: Gift, label: 'Points & Rewards', path: '/points-rewards' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: UserCheck, label: 'User Management', path: '/user-management' },
    { icon: Megaphone, label: 'Flash Sales', path: '/flash-sales' },
    { icon: Store, label: 'Frontend', path: '/frontend' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onLinkClick}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="h-5 w-5 mr-3" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationSidebar;
