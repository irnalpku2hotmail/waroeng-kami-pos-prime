
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';

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
  );
};

export default NotificationDropdown;
