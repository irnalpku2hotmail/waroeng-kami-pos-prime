import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  CreditCard,
  FileText,
  Gift,
  Zap,
  Bell,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NavigationSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { 
      name: 'Products', 
      href: '/products', 
      icon: Package,
      roles: ['admin', 'manager', 'staff']
    },
    { 
      name: 'Categories & Units', 
      href: '/categories-units', 
      icon: FileText,
      roles: ['admin', 'manager', 'staff']
    },
    { 
      name: 'Inventory', 
      href: '/inventory', 
      icon: Package,
      roles: ['admin', 'manager', 'staff']
    },
    { 
      name: 'Purchases', 
      href: '/purchases', 
      icon: ShoppingBag,
      roles: ['admin', 'manager', 'staff']
    },
    { 
      name: 'Returns', 
      href: '/returns', 
      icon: RotateCcw,
      roles: ['admin', 'manager', 'staff']
    },
    { name: 'POS', href: '/pos', icon: ShoppingCart },
    { name: 'Orders', href: '/orders', icon: FileText },
    { name: 'Customers', href: '/customers', icon: Users },
    { 
      name: 'Suppliers', 
      href: '/suppliers', 
      icon: Users,
      roles: ['admin', 'manager', 'staff']
    },
    { 
      name: 'Credit Management', 
      href: '/credit-management', 
      icon: CreditCard,
      roles: ['admin', 'manager', 'staff', 'cashier']
    },
    { 
      name: 'Points & Rewards', 
      href: '/points-rewards', 
      icon: Gift,
      roles: ['admin', 'manager', 'staff', 'cashier']
    },
    { name: 'Point Exchange', href: '/point-exchange', icon: Gift },
    { 
      name: 'Flash Sales', 
      href: '/flash-sales', 
      icon: Zap,
      roles: ['admin', 'manager', 'staff']
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: BarChart3,
      roles: ['admin', 'manager', 'staff']
    },
    { 
      name: 'Expenses', 
      href: '/expenses', 
      icon: FileText,
      roles: ['admin', 'manager', 'staff']
    },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { 
      name: 'User Management', 
      href: '/user-management', 
      icon: UserCheck,
      roles: ['admin']
    },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Frontend', href: '/frontend', icon: FileText }
  ];

  const filteredItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || 'buyer');
  });

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold text-blue-800">POS System</h2>
      </div>
      <nav className="mt-4">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  location.pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default NavigationSidebar;
