import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, AlertTriangle, TrendingDown, Calendar, Clock, CheckCircle, Filter, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 20;

const Notifications = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', currentPage],
    queryFn: async () => {
      // Get low stock products - compare current_stock with min_stock directly
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Filter low stock products in JavaScript
      const filteredLowStock = lowStockProducts?.filter(p => p.current_stock <= p.min_stock) || [];

      // Get overdue credit transactions - compare total_amount with paid_amount directly
      const { data: overdueCredits } = await supabase
        .from('transactions')
        .select('*, customers(name)')
        .eq('is_credit', true)
        .lt('due_date', new Date().toISOString().split('T')[0]);

      // Filter overdue credits in JavaScript
      const filteredOverdueCredits = overdueCredits?.filter(t => t.total_amount > t.paid_amount) || [];

      // Get overdue purchase payments
      const { data: overduePurchases } = await supabase
        .from('purchases')
        .select('*, suppliers(name)')
        .eq('payment_method', 'credit')
        .neq('payment_status', 'paid')
        .lt('due_date', new Date().toISOString().split('T')[0]);

      // Get recent orders that need attention
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get returns that need processing
      const { data: pendingReturns } = await supabase
        .from('returns')
        .select('*, suppliers(name)')
        .eq('status', 'process')
        .order('created_at', { ascending: false })
        .limit(10);

      const notifications = [
        ...(filteredLowStock?.map(product => ({
          id: `low-stock-${product.id}`,
          type: 'low_stock',
          title: 'Stok Rendah',
          message: `${product.name} tersisa ${product.current_stock} unit (minimum: ${product.min_stock})`,
          time: new Date().toISOString(),
          priority: 'high',
          icon: Package
        })) || []),
        ...(filteredOverdueCredits?.map(credit => ({
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

      // Sort by priority and time
      const sortedNotifications = notifications.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });

      // Filter by priority if selected
      const filteredNotifications = selectedPriority === 'all' 
        ? sortedNotifications 
        : sortedNotifications.filter(n => n.priority === selectedPriority);

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE;
      const paginatedNotifications = filteredNotifications.slice(from, to);

      return {
        data: paginatedNotifications,
        count: filteredNotifications.length
      };
    }
  });

  const notifications = notificationsData?.data || [];
  const notificationsCount = notificationsData?.count || 0;
  const totalPages = Math.ceil(notificationsCount / ITEMS_PER_PAGE);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Notifikasi & Peringatan</h1>
                <p className="text-blue-100">Pantau status penting sistem Anda</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{notificationsCount}</div>
              <div className="text-blue-100">Total notifikasi</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Notifikasi
              </CardTitle>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedPriority === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('all')}
              >
                Semua
              </Button>
              <Button
                variant={selectedPriority === 'urgent' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('urgent')}
              >
                Mendesak
              </Button>
              <Button
                variant={selectedPriority === 'high' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('high')}
              >
                Tinggi
              </Button>
              <Button
                variant={selectedPriority === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('medium')}
              >
                Sedang
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Semua Terkendali!</h3>
                <p className="text-gray-500 text-center">Tidak ada notifikasi yang memerlukan perhatian saat ini.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <Card key={notification.id} className={`border-l-4 ${getPriorityColor(notification.priority)} hover:shadow-md transition-shadow`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 rounded-full bg-white shadow-sm">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityBadge(notification.priority) as "default" | "destructive" | "outline" | "secondary"} className="text-xs">
                                {getPriorityLabel(notification.priority)}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.time).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs h-6">
                              Tandai Dibaca
                            </Button>
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
