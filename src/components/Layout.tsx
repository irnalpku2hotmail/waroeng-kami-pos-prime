
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
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
  LogOut,
  Menu,
  Building2,
  Receipt,
  Bell,
  Calendar,
  Clock
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// Helper function to format relative time
const formatRelativeTime = (date: string | Date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Baru saja';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} menit lalu`;
  } else if (diffInHours < 24) {
    return `${diffInHours} jam lalu`;
  } else if (diffInDays < 7) {
    return `${diffInDays} hari lalu`;
  } else {
    return targetDate.toLocaleDateString('id-ID');
  }
};

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch store settings for store name
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  // Fetch notifications with enhanced data
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const today = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      const notifications = [];

      // Customer birthdays (today)
      const { data: birthdayCustomers } = await supabase
        .from('customers')
        .select('name, date_of_birth, created_at')
        .not('date_of_birth', 'is', null);

      if (birthdayCustomers) {
        const todayBirthdays = birthdayCustomers.filter(customer => {
          if (!customer.date_of_birth) return false;
          const birthday = new Date(customer.date_of_birth);
          return birthday.getMonth() === today.getMonth() && birthday.getDate() === today.getDate();
        });

        todayBirthdays.forEach(customer => {
          notifications.push({
            type: 'birthday',
            message: `🎂 ${customer.name} has a birthday today!`,
            priority: 'medium',
            link: '/customers',
            timestamp: today.toISOString()
          });
        });
      }

      // Low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, current_stock, min_stock, updated_at')
        .lt('current_stock', 10);

      if (lowStockProducts && lowStockProducts.length > 0) {
        notifications.push({
          type: 'low_stock',
          message: `📦 ${lowStockProducts.length} products have low stock`,
          priority: 'high',
          link: '/products',
          timestamp: lowStockProducts[0].updated_at || today.toISOString()
        });
      }

      // Product expiration (1 month before)
      const { data: expiringProducts } = await supabase
        .from('purchase_items')
        .select('expiration_date, products(name), created_at')
        .not('expiration_date', 'is', null)
        .lte('expiration_date', oneMonthFromNow.toISOString().split('T')[0])
        .gte('expiration_date', today.toISOString().split('T')[0]);

      if (expiringProducts && expiringProducts.length > 0) {
        notifications.push({
          type: 'expiring',
          message: `⚠️ ${expiringProducts.length} products expiring within a month`,
          priority: 'medium',
          link: '/inventory',
          timestamp: expiringProducts[0].created_at || today.toISOString()
        });
      }

      // New orders (pending status)
      const { data: newOrders } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('status', 'pending');

      if (newOrders && newOrders.length > 0) {
        notifications.push({
          type: 'new_order',
          message: `🛒 ${newOrders.length} new orders pending`,
          priority: 'high',
          link: '/orders',
          timestamp: newOrders[0].created_at
        });
      }

      // Overdue credit purchases
      const { data: overdueCredits } = await supabase
        .from('purchases')
        .select('id, suppliers(name), due_date, created_at')
        .eq('payment_method', 'credit')
        .lt('due_date', today.toISOString().split('T')[0]);

      if (overdueCredits && overdueCredits.length > 0) {
        notifications.push({
          type: 'overdue_credit',
          message: `💳 ${overdueCredits.length} credit payments overdue`,
          priority: 'high',
          link: '/credit-management',
          timestamp: overdueCredits[0].created_at
        });
      }

      // New user registrations (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: newUsers } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', yesterday.toISOString());

      if (newUsers && newUsers.length > 0) {
        notifications.push({
          type: 'new_user',
          message: `👤 ${newUsers.length} new users registered`,
          priority: 'low',
          link: '/user-management',
          timestamp: newUsers[0].created_at
        });
      }

      // Sort notifications by timestamp (newest first)
      return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  });

  const storeName = settings?.store_name?.name || 'SmartPOS';

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: Ruler, label: 'Categories & Units', href: '/categories-units' },
    { icon: Building2, label: 'Suppliers', href: '/suppliers' },
    { icon: ShoppingCart, label: 'POS', href: '/pos' },
    { icon: Package2, label: 'Inventory', href: '/inventory' },
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: Receipt, label: 'Orders', href: '/orders' },
    { icon: CreditCard, label: 'Credit Management', href: '/credit-management' },
    { icon: TrendingDown, label: 'Expenses', href: '/expenses' },
    { icon: Gift, label: 'Points & Rewards', href: '/points-rewards' },
    { icon: Star, label: 'Point Exchange', href: '/point-exchange' },
    { icon: Zap, label: 'Flash Sales', href: '/flash-sales' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: UserCog, label: 'User Management', href: '/user-management' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const getNotificationCount = () => {
    if (!notifications) return 0;
    return notifications.length;
  };

  const getHighPriorityCount = () => {
    if (!notifications) return 0;
    return notifications.filter(n => n.priority === 'high').length;
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Get user avatar URL
  const getUserAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return null;
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email || '';
  };

  const NavigationContent = () => (
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
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-blue-800 mb-6">{storeName}</h2>
                  <NavigationContent />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-bold text-blue-800">{storeName}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Date and Time */}
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {currentDateTime.toLocaleDateString('id-ID', { 
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {currentDateTime.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {getNotificationCount() > 0 && (
                    <Badge 
                      className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs ${
                        getHighPriorityCount() > 0 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                    >
                      {getNotificationCount()}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <div className="p-3 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <DropdownMenuItem 
                        key={index} 
                        className="p-3 border-b cursor-pointer hover:bg-gray-50"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.priority === 'high' ? 'bg-red-500' :
                            notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No notifications
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu with Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getUserAvatarUrl()} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {getUserDisplayName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {getUserDisplayName()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <NavigationContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
