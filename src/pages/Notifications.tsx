
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, AlertTriangle, TrendingDown, Calendar, Clock, Filter, X } from 'lucide-react';
import Layout from '@/components/Layout';
import PaginationComponent from '@/components/PaginationComponent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ITEMS_PER_PAGE = 20;

const Notifications = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', currentPage, priorityFilter, typeFilter],
    queryFn: async () => {
      // Get low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      const filteredLowStock = lowStockProducts?.filter(p => p.current_stock <= p.min_stock) || [];

      // Get overdue credit transactions
      const { data: overdueCredits } = await supabase
        .from('transactions')
        .select('*, customers(name)')
        .eq('is_credit', true)
        .lt('due_date', new Date().toISOString().split('T')[0]);

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

      let notifications = [
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

      // Apply filters
      if (priorityFilter !== 'all') {
        notifications = notifications.filter(n => n.priority === priorityFilter);
      }
      if (typeFilter !== 'all') {
        notifications = notifications.filter(n => n.type === typeFilter);
      }

      // Sort by priority and time
      const sortedNotifications = notifications.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE;
      const paginatedNotifications = sortedNotifications.slice(from, to);

      return {
        data: paginatedNotifications,
        count: sortedNotifications.length
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

  const clearFilters = () => {
    setPriorityFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
              <p className="text-gray-600 mt-1">
                {notificationsCount} notifikasi ditemukan
              </p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="urgent">Mendesak</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="low">Rendah</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="low_stock">Stok Rendah</SelectItem>
                <SelectItem value="overdue_payment">Piutang Terlambat</SelectItem>
                <SelectItem value="overdue_purchase">Hutang Terlambat</SelectItem>
                <SelectItem value="pending_order">Pesanan Baru</SelectItem>
                <SelectItem value="pending_return">Return Proses</SelectItem>
              </SelectContent>
            </Select>

            {(priorityFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Bersihkan
              </Button>
            )}
          </div>
        </div>

        {/* Notifications Grid */}
        <div className="grid gap-4">
          {notifications.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Tidak ada notifikasi
                </h3>
                <p className="text-gray-500 text-center">
                  {priorityFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Tidak ada notifikasi yang sesuai dengan filter yang dipilih'
                    : 'Semua notifikasi sudah clear'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <Card 
                    key={notification.id} 
                    className={`${getPriorityColor(notification.priority)} border-l-4 hover:shadow-md transition-shadow`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                          <IconComponent className="h-6 w-6 text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            <Badge variant={getPriorityBadge(notification.priority) as "default" | "destructive" | "outline" | "secondary"}>
                              {getPriorityLabel(notification.priority)}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-3 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(notification.time).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={notificationsCount}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
