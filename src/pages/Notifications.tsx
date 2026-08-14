
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, AlertTriangle, TrendingDown, Calendar, Clock, Filter, X } from 'lucide-react';
import Layout from '@/components/Layout';
import PaginationComponent from '@/components/PaginationComponent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminNotificationsKey, fetchAdminNotifications } from '@/lib/adminQueries';

const ITEMS_PER_PAGE = 20;

const TYPE_ICONS: Record<string, typeof Bell> = {
  low_stock: Package,
  overdue_payment: AlertTriangle,
  overdue_purchase: TrendingDown,
  pending_order: Bell,
  pending_return: TrendingDown,
};

const Notifications = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filtering, sorting, paging and counting all happen inside Postgres —
  // the browser only ever receives one page of rows.
  const { data: notificationsData } = useQuery({
    queryKey: adminNotificationsKey(priorityFilter, typeFilter, currentPage, ITEMS_PER_PAGE),
    queryFn: () => fetchAdminNotifications(priorityFilter, typeFilter, currentPage, ITEMS_PER_PAGE),
    placeholderData: keepPreviousData,
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
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1); }}>
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

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
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
                const IconComponent = TYPE_ICONS[notification.type] || Bell;
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
                              {new Date(notification.event_time).toLocaleDateString('id-ID', {
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
