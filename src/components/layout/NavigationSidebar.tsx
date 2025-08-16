
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings, 
  TrendingUp,
  UserCheck,
  CreditCard,
  Archive,
  DollarSign,
  Gift,
  Zap,
  BarChart3,
  UserCog,
  Layers,
  MapPin,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type UserRole = 'admin' | 'manager' | 'staff' | 'cashier' | 'buyer';

interface NavigationSidebarProps {
  onLinkClick?: () => void;
}

const NavigationSidebar = ({ onLinkClick }: NavigationSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Safely get user role with fallback
  const getUserRole = (): UserRole => {
    if (!profile?.role) return 'staff';
    
    const validRoles: UserRole[] = ['admin', 'manager', 'staff', 'cashier', 'buyer'];
    const role = profile.role as string;
    
    if (validRoles.includes(role as UserRole)) {
      return role as UserRole;
    }
    
    return 'staff';
  };

  const userRole = getUserRole();

  // Role-based access control
  const hasAccess = (requiredRoles: UserRole[]) => {
    return requiredRoles.includes(userRole);
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'staff', 'cashier'] as UserRole[]
    },
    {
      title: 'Products',
      href: '/products',
      icon: Package,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'Categories & Units',
      href: '/categories-units',
      icon: Layers,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'POS',
      href: '/pos',
      icon: ShoppingCart,
      roles: ['admin', 'manager', 'staff', 'cashier'] as UserRole[]
    },
    {
      title: 'Orders',
      href: '/orders',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'Inventory',
      href: '/inventory',
      icon: Archive,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'Purchases',
      href: '/purchases',
      icon: TrendingUp,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'Returns',
      href: '/returns',
      icon: UserCheck,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'Credit Management',
      href: '/credit',
      icon: CreditCard,
      roles: ['admin', 'manager'] as UserRole[]
    },
    {
      title: 'Customers',
      href: '/customers',
      icon: Users,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'Suppliers',
      href: '/suppliers',
      icon: UserCog,
      roles: ['admin', 'manager', 'staff'] as UserRole[]
    },
    {
      title: 'Expenses',
      href: '/expenses',
      icon: DollarSign,
      roles: ['admin', 'manager'] as UserRole[]
    },
    {
      title: 'Flash Sales',
      href: '/flash-sales',
      icon: Zap,
      roles: ['admin', 'manager'] as UserRole[]
    },
    {
      title: 'Points & Rewards',
      href: '/points-rewards',
      icon: Gift,
      roles: ['admin', 'manager'] as UserRole[]
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager'] as UserRole[]
    },
    {
      title: 'User Management',
      href: '/user-management',
      icon: UserCog,
      roles: ['admin'] as UserRole[]
    },
    {
      title: 'User Locations',
      href: '/user-locations',
      icon: MapPin,
      roles: ['admin', 'manager'] as UserRole[]
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: Bell,
      roles: ['admin', 'manager', 'staff', 'cashier'] as UserRole[]
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['admin', 'manager'] as UserRole[]
    }
  ];

  const filteredItems = navigationItems.filter(item => hasAccess(item.roles));

  const handleNavigation = (href: string) => {
    navigate(href);
    onLinkClick?.();
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <p className="text-sm text-gray-500">
              {String(profile?.full_name || user?.email || '')}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start text-left ${isCollapsed ? 'px-2' : 'px-3'} py-2 h-auto`}
                onClick={() => handleNavigation(item.href)}
              >
                <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                {!isCollapsed && (
                  <span className="truncate">{item.title}</span>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {String(userRole || '')}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationSidebar;
