
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Package, ShoppingCart, Users, BarChart3, Settings,
  CreditCard, UserCheck, MapPin, Truck, FileText, Star,
  Zap, Archive, TrendingUp, LayoutDashboard,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CollapsibleSidebarProps {
  onLinkClick?: () => void;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ onLinkClick }) => {
  const { canAccessRoute } = usePermissions();
  const { collapsed, setCollapsed } = useSidebarContext();
  const isMobile = useIsMobile();

  const menuItems = [
    { name: 'Home', path: '/', icon: Home, resource: 'dashboard', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, resource: 'dashboard', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { name: 'POS', path: '/pos', icon: ShoppingCart, resource: 'pos', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Products', path: '/products', icon: Package, resource: 'products', color: 'text-orange-500', bg: 'bg-orange-50' },
    { name: 'Categories & Units', path: '/categories', icon: Archive, resource: 'categories', color: 'text-amber-500', bg: 'bg-amber-50' },
    { name: 'Inventory', path: '/inventory', icon: TrendingUp, resource: 'inventory', color: 'text-teal-500', bg: 'bg-teal-50' },
    { name: 'Orders', path: '/orders', icon: FileText, resource: 'orders', color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { name: 'Purchases', path: '/purchases', icon: Truck, resource: 'purchases', color: 'text-violet-500', bg: 'bg-violet-50' },
    { name: 'Returns', path: '/returns', icon: Archive, resource: 'returns', color: 'text-rose-500', bg: 'bg-rose-50' },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, resource: 'suppliers', color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Customers', path: '/customers', icon: Users, resource: 'customers', color: 'text-sky-500', bg: 'bg-sky-50' },
    { name: 'Credit Management', path: '/credit-management', icon: CreditCard, resource: 'credit-management', color: 'text-pink-500', bg: 'bg-pink-50' },
    { name: 'User Management', path: '/user-management', icon: UserCheck, resource: 'users', color: 'text-lime-600', bg: 'bg-lime-50' },
    { name: 'User Locations', path: '/user-locations', icon: MapPin, resource: 'user-locations', color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Point Exchange', path: '/point-exchange', icon: Star, resource: 'point-exchange', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { name: 'Points & Rewards', path: '/points-rewards', icon: Star, resource: 'points-rewards', color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Flash Sales', path: '/flash-sales', icon: Zap, resource: 'flash-sales', color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Expenses', path: '/expenses', icon: FileText, resource: 'expenses', color: 'text-slate-500', bg: 'bg-slate-50' },
    { name: 'Reports', path: '/reports', icon: BarChart3, resource: 'reports', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Settings', path: '/settings', icon: Settings, resource: 'settings', color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  const allowedMenuItems = menuItems.filter(item => canAccessRoute(item.resource));

  const handleLinkClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
    onLinkClick?.();
  };

  const navLinkClasses = (isActive: boolean, isMobileView: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl ${isMobileView ? 'text-[13px]' : 'text-sm'} font-medium transition-all duration-200 ease-in-out ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="fixed top-3 left-3 z-50 h-9 w-9 p-0 rounded-xl bg-card shadow-sm border border-border"
        >
          <Menu className="h-4 w-4 text-foreground" />
        </Button>

        <div className={`fixed left-0 top-0 h-screen w-72 bg-card border-r border-border flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${collapsed ? '-translate-x-full' : 'translate-x-0'}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-base font-semibold text-foreground tracking-tight">Menu</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3 py-3 scrollbar-thin">
            <nav className="space-y-1">
              {allowedMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={({ isActive }) => navLinkClasses(isActive, true)}
                  >
                    <span className={`flex items-center justify-center h-7 w-7 rounded-lg ${item.bg} flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </span>
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
    <TooltipProvider delayDuration={0}>
      <div className={`${collapsed ? 'w-[68px]' : 'w-60'} transition-all duration-300 ease-in-out bg-card border-r border-border flex flex-col fixed left-0 top-0 h-screen z-20`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border min-h-[60px] flex-shrink-0">
          {!collapsed && (
            <span className="text-base font-semibold text-foreground tracking-tight">Menu</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 flex-shrink-0 rounded-lg hover:bg-accent mx-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3 scrollbar-thin">
          <nav className="space-y-1">
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              
              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.path}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          `flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-200 ease-in-out ${
                            isActive
                              ? 'bg-primary/10'
                              : 'hover:bg-accent'
                          }`
                        }
                      >
                        <span className={`flex items-center justify-center h-7 w-7 rounded-lg ${item.bg}`}>
                          <Icon className={`h-[16px] w-[16px] ${item.color}`} />
                        </span>
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) => navLinkClasses(isActive, false)}
                >
                  <span className={`flex items-center justify-center h-7 w-7 rounded-lg ${item.bg} flex-shrink-0`}>
                    <Icon className={`h-[16px] w-[16px] ${item.color}`} />
                  </span>
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};

export default CollapsibleSidebar;
