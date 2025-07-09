
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Package, ShoppingCart, AlertTriangle, Users, CheckCircle, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'birthday':
      return <Calendar className="h-5 w-5 text-purple-500" />;
    case 'low_stock':
      return <Package className="h-5 w-5 text-red-500" />;
    case 'expiring':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'new_order':
      return <ShoppingCart className="h-5 w-5 text-blue-500" />;
    case 'overdue_credit':
      return <Clock className="h-5 w-5 text-red-500" />;
    case 'new_user':
      return <Users className="h-5 w-5 text-green-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const Notifications = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Fetch all notifications
  const { data: allNotifications, isLoading } = useQuery({
    queryKey: ['all-notifications'],
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
            title: 'Ulang Tahun Pelanggan',
            message: `🎂 ${customer.name} berulang tahun hari ini!`,
            priority: 'medium',
            timestamp: today.toISOString(),
            read: false
          });
        });
      }

      // Low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, current_stock, min_stock, updated_at')
        .lt('current_stock', 10);

      if (lowStockProducts && lowStockProducts.length > 0) {
        lowStockProducts.forEach(product => {
          notifications.push({
            id: `low-stock-${product.name}`,
            type: 'low_stock',
            title: 'Stok Produk Menipis',
            message: `📦 ${product.name} tersisa ${product.current_stock} unit`,
            priority: 'high',
            timestamp: product.updated_at || today.toISOString(),
            read: false
          });
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
        expiringProducts.forEach(item => {
          notifications.push({
            id: `expiring-${item.products?.name}-${item.expiration_date}`,
            type: 'expiring',
            title: 'Produk Akan Kedaluwarsa',
            message: `⚠️ ${item.products?.name} akan kedaluwarsa pada ${new Date(item.expiration_date!).toLocaleDateString('id-ID')}`,
            priority: 'medium',
            timestamp: item.created_at || today.toISOString(),
            read: false
          });
        });
      }

      // New orders (pending status)
      const { data: newOrders } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, created_at')
        .eq('status', 'pending');

      if (newOrders && newOrders.length > 0) {
        newOrders.forEach(order => {
          notifications.push({
            id: `new-order-${order.id}`,
            type: 'new_order',
            title: 'Pesanan Baru',
            message: `🛒 Pesanan baru dari ${order.customer_name} (${order.order_number})`,
            priority: 'high',
            timestamp: order.created_at,
            read: false
          });
        });
      }

      // Overdue credit purchases
      const { data: overdueCredits } = await supabase
        .from('purchases')
        .select('id, purchase_number, suppliers(name), due_date, created_at')
        .eq('payment_method', 'credit')
        .lt('due_date', today.toISOString().split('T')[0]);

      if (overdueCredits && overdueCredits.length > 0) {
        overdueCredits.forEach(purchase => {
          notifications.push({
            id: `overdue-credit-${purchase.id}`,
            type: 'overdue_credit',
            title: 'Pembayaran Kredit Terlambat',
            message: `💳 Pembayaran pembelian ${purchase.purchase_number} dari ${purchase.suppliers?.name} sudah terlambat`,
            priority: 'high',
            timestamp: purchase.created_at,
            read: false
          });
        });
      }

      // New user registrations (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const { data: newUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .gte('created_at', lastWeek.toISOString());

      if (newUsers && newUsers.length > 0) {
        newUsers.forEach(user => {
          notifications.push({
            id: `new-user-${user.id}`,
            type: 'new_user',
            title: 'Pengguna Baru Terdaftar',
            message: `👤 ${user.full_name} (${user.email}) telah terdaftar`,
            priority: 'low',
            timestamp: user.created_at,
            read: false
          });
        });
      }

      // Sort notifications by timestamp (newest first)
      return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  });

  // Filter notifications by priority
  const filteredNotifications = allNotifications?.filter(notification => {
    if (filterPriority === 'all') return true;
    return notification.priority === filterPriority;
  }) || [];

  // Paginate notifications
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  const getNotificationCounts = () => {
    if (!allNotifications) return { high: 0, medium: 0, low: 0, total: 0 };
    
    const counts = allNotifications.reduce((acc, notification) => {
      acc[notification.priority]++;
      acc.total++;
      return acc;
    }, { high: 0, medium: 0, low: 0, total: 0 });
    
    return counts;
  };

  const counts = getNotificationCounts();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Notifikasi</h1>
          <Badge variant="secondary" className="text-sm">
            {counts.total} Notifikasi
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterPriority('all')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifikasi</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.total}</div>
              <p className="text-xs text-muted-foreground">Semua prioritas</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterPriority('high')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioritas Tinggi</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{counts.high}</div>
              <p className="text-xs text-muted-foreground">Perlu perhatian segera</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterPriority('medium')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioritas Sedang</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{counts.medium}</div>
              <p className="text-xs text-muted-foreground">Perlu tindak lanjut</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterPriority('low')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioritas Rendah</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{counts.low}</div>
              <p className="text-xs text-muted-foreground">Informasi</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterPriority === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('all')}
          >
            Semua ({counts.total})
          </Button>
          <Button
            variant={filterPriority === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('high')}
          >
            Tinggi ({counts.high})
          </Button>
          <Button
            variant={filterPriority === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('medium')}
          >
            Sedang ({counts.medium})
          </Button>
          <Button
            variant={filterPriority === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('low')}
          >
            Rendah ({counts.low})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : paginatedNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Tidak ada notifikasi</h3>
                <p className="text-gray-400">
                  {filterPriority === 'all' 
                    ? 'Semua notifikasi sudah dibaca atau belum ada yang baru'
                    : `Tidak ada notifikasi dengan prioritas ${filterPriority}`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            paginatedNotifications.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority === 'high' ? 'Tinggi' : 
                             notification.priority === 'medium' ? 'Sedang' : 'Rendah'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredNotifications.length}
          />
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
