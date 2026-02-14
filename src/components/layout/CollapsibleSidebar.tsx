
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
            <nav className="space-y-0.5">
              {allowedMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={({ isActive }) => navLinkClasses(isActive, true)}
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
          <nav className="space-y-0.5">
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
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`
                        }
                      >
                        <Icon className="h-[18px] w-[18px]" />
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
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
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
