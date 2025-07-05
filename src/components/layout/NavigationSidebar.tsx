
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Ruler, 
  ShoppingCart, 
  Package2, 
  Users, 
  CreditCard, 
  TrendingDown, 
  Gift, 
  Star, 
  Zap, 
  Settings, 
  UserCog,
  Building2,
  Receipt,
  BarChart3
} from 'lucide-react';

interface NavigationSidebarProps {
  onLinkClick?: () => void;
}

const NavigationSidebar = ({ onLinkClick }: NavigationSidebarProps) => {
  const location = useLocation();

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: Ruler, label: 'Categories & Units', href: '/categories-units' },
    { icon: Building2, label: 'Suppliers', href: '/suppliers' },
    { icon: ShoppingCart, label: 'POS', href: '/pos' },
    { icon: Package2, label: 'Inventory', href: '/inventory' },
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: Receipt, label: 'Orders', href: '/orders' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: CreditCard, label: 'Credit Management', href: '/credit-management' },
    { icon: TrendingDown, label: 'Expenses', href: '/expenses' },
    { icon: Gift, label: 'Rewards', href: '/points-rewards' },
    { icon: Star, label: 'Point Exchange', href: '/point-exchange' },
    { icon: Zap, label: 'Flash Sales', href: '/flash-sales' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: UserCog, label: 'User Management', href: '/user-management' },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveRoute(item.href);
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={onLinkClick}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationSidebar;
