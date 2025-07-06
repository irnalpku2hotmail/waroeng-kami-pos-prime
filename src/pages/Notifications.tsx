
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 20;

const Notifications = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Get low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('*')
        .filter('current_stock', 'lt', 'min_stock')
        .eq('is_active', true)
        .range(from, to);

      // Get overdue credit transactions
      const { data: overdueCredits } = await supabase
        .from('transactions')
        .select('*, customers(name)')
        .eq('is_credit', true)
        .lt('due_date', new Date().toISOString().split('T')[0])
        .gt('paid_amount', 0)
        .range(from, to);

      // Get overdue purchase payments
      const { data: overduePurchases } = await supabase
        .from('purchases')
        .select('*, suppliers(name)')
        .eq('payment_method', 'credit')
        .neq('payment_status', 'paid')
        .lt('due_date', new Date().toISOString().split('T')[0])
        .range(from, to);

      // Get recent orders that need attention
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Get returns that need processing
      const { data: pendingReturns } = await supabase
        .from('returns')
        .select('*, suppliers(name)')
        .eq('status', 'process')
        .order('created_at', { ascending: false })
        .range(from, to);

      const notifications = [
        ...(lowStockProducts?.map(product => ({
          id: `low-stock-${product.id}`,
          type: 'low_stock',
          title: 'Stok Rendah',
          message: `${product.name} tersisa ${product.current_stock} unit (minimum: ${product.min_stock})`,
          time: new Date().toISOString(),
          priority: 'high',
          icon: Package
        })) || []),
        ...(overdueCredits?.map(credit => ({
          id: `overdue-credit-${credit.id}`,
          type: 'overdue_payment',
          title: 'Piutang Terlambat',
          message: `${credit.customers?.name || 'Customer'} - Rp ${credit.total_amount.toLocaleString('id-ID')}`,
          time: credit.due_date,
          priority: 'urgent',
          icon: AlertTriangle
        })) || []),
        ...(overduePurchases?.map(purchase => ({
          id: `overdue-purchase-${purchase.id}`,
          type: 'overdue_purchase',
          title: 'Hutang Terlambat',
          message: `${purchase.suppliers?.name || 'Supplier'} - ${purchase.purchase_number} - Rp ${purchase.total_amount.toLocaleString('id-ID')}`,
          time: purchase.due_date,
          priority: 'urgent',
          icon: TrendingDown
        })) || []),
        ...(pendingOrders?.map(order => ({
          id: `pending-order-${order.id}`,
          type: 'pending_order',
          title: 'Pesanan Baru',
          message: `${order.customer_name} - ${order.order_number}`,
          time: order.created_at,
          priority: 'medium',
          icon: Bell
        })) || []),
        ...(pendingReturns?.map(returnItem => ({
          id: `pending-return-${returnItem.id}`,
          type: 'pending_return',
          title: 'Return Menunggu Proses',
          message: `${returnItem.suppliers?.name || 'Supplier'} - ${returnItem.return_number}`,
          time: returnItem.created_at,
          priority: 'medium',
          icon: TrendingDown
        })) || [])
      ];

      return {
        data: notifications.sort((a, b) => {
          // Sort by priority first (urgent > high > medium > low)
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                              (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then sort by time (newest first)
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        }),
        count: notifications.length
      };
    }
  });

  const notifications = notificationsData?.data || [];
  const notificationsCount = notificationsData?.count || 0;
  const totalPages = Math.ceil(notificationsCount / ITEMS_PER_PAGE);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-200 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return colors[priority as keyof typeof colors] || 'secondary';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: 'Mendesak',
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notifikasi & Peringatan</h1>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {notificationsCount} notifikasi
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Tidak ada notifikasi</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <Card key={notification.id} className={`border ${getPriorityColor(notification.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{notification.title}</h3>
                            <Badge variant={getPriorityBadge(notification.priority) as "default" | "destructive" | "outline" | "secondary"}>
                              {getPriorityLabel(notification.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(notification.time).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {totalPages > 1 && (
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={notificationsCount}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
