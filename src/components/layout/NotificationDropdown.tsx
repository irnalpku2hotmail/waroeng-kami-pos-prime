import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Check, CheckCheck } from 'lucide-react';

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

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

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
            id: `birthday-${customer.name}`,
            type: 'birthday',
            message: `🎂 ${customer.name} berulang tahun hari ini!`,
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
          id: 'low-stock',
          type: 'low_stock',
          message: `📦 ${lowStockProducts.length} produk stok menipis`,
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
          id: 'expiring-products',
          type: 'expiring',
          message: `⚠️ ${expiringProducts.length} produk akan kedaluwarsa dalam sebulan`,
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
          id: 'new-orders',
          type: 'new_order',
          message: `🛒 ${newOrders.length} pesanan baru menunggu`,
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
          id: 'overdue-credits',
          type: 'overdue_credit',
          message: `💳 ${overdueCredits.length} pembayaran kredit terlambat`,
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
          id: 'new-users',
          type: 'new_user',
          message: `👤 ${newUsers.length} pengguna baru terdaftar`,
          priority: 'low',
          link: '/user-management',
          timestamp: newUsers[0].created_at
        });
      }

      // Sort notifications by timestamp (newest first)
      return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  });

  const getUnreadNotifications = () => {
    if (!notifications) return [];
    return notifications.filter(n => !readNotifications.has(n.id));
  };

  const getNotificationCount = () => {
    return getUnreadNotifications().length;
  };

  const getHighPriorityCount = () => {
    return getUnreadNotifications().filter(n => n.priority === 'high').length;
  };

  const markNotificationAsRead = (notificationId: string) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
  };

  const markAllNotificationsAsRead = () => {
    if (notifications) {
      setReadNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleNotificationClick = (notification: any) => {
    markNotificationAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
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
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Notifikasi</h3>
          <div className="flex gap-2">
            {getNotificationCount() > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllNotificationsAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Tandai dibaca
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/notifications')}
              className="text-xs"
            >
              Lihat Semua
            </Button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.slice(0, 5).map((notification, index) => {
              const isRead = readNotifications.has(notification.id);
              return (
                <DropdownMenuItem 
                  key={index} 
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${isRead ? 'opacity-60' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      isRead ? 'bg-gray-300' :
                      notification.priority === 'high' ? 'bg-red-500' :
                      notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="p-3 text-center text-gray-500">
              Tidak ada notifikasi
            </div>
          )}
          {notifications && notifications.length > 5 && (
            <div className="p-3 border-t text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/notifications')}
                className="text-xs"
              >
                Lihat {notifications.length - 5} notifikasi lainnya
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
