
import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FixedSidebarProps {
  onLinkClick?: () => void;
}

const FixedSidebar: React.FC<FixedSidebarProps> = ({ onLinkClick }) => {
  const { canAccessRoute } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
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

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full z-40`}>
      {/* Header with toggle button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[64px]">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900 truncate">Admin Panel</h2>
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
                onClick={onLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
};

export default FixedSidebar;
