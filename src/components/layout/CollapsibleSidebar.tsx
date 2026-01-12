
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
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface CollapsibleSidebarProps {
  onLinkClick?: () => void;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ onLinkClick }) => {
  const { canAccessRoute } = usePermissions();
  const { collapsed, setCollapsed } = useSidebarContext();
  const isMobile = useIsMobile();

  const menuItems = [
    { name: 'Home', path: '/', icon: Home, resource: 'dashboard' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, resource: 'dashboard' },
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

  const allowedMenuItems = menuItems.filter(item => canAccessRoute(item.resource));

  const handleLinkClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
    onLinkClick?.();
  };

  // Mobile: show/hide sidebar with slide animation
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button - fixed position */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="fixed top-2 left-2 z-50 h-10 w-10 p-0 bg-white shadow-md border"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile sidebar - slide from left */}
        <div className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transform transition-transform duration-300 ${collapsed ? '-translate-x-full' : 'translate-x-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 min-h-[52px]">
            <h2 className="text-sm font-semibold text-gray-900">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-2">
            <nav className="space-y-1">
              {allowedMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-screen z-20`}>
      {/* Header with toggle button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 min-h-[60px] flex-shrink-0">
        {!collapsed && (
          <h2 className="text-sm font-semibold text-gray-900 truncate">Menu</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-1">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
};

export default CollapsibleSidebar;
