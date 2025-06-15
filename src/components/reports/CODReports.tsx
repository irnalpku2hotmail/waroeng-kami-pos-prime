
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const CODReports = () => {
  // COD orders summary
  const { data: codSummary, isLoading: isLoadingCodSummary } = useQuery({
    queryKey: ['cod-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_method, status, total_amount, order_date')
        .eq('payment_method', 'cod');

      if (error) throw error;

      const summary = data.reduce((acc, order) => {
        const status = order.status || 'pending';
        if (!acc[status]) {
          acc[status] = { status, count: 0, total: 0 };
        }
        acc[status].count += 1;
        acc[status].total += order.total_amount || 0;
        return acc;
      }, {} as Record<string, { status: string; count: number; total: number }>);

      return Object.values(summary);
    },
  });

  // COD orders by month
  const { data: codByMonth, isLoading: isLoadingCodByMonth } = useQuery({
    queryKey: ['cod-by-month'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_date, total_amount, status')
        .eq('payment_method', 'cod')
        .order('order_date', { ascending: true });

      if (error) throw error;

      const monthlyData = data.reduce((acc, order) => {
        const date = new Date(order.order_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, delivered: 0, pending: 0, cancelled: 0 };
        }
        
        const amount = order.total_amount || 0;
        if (order.status === 'delivered') {
          acc[monthKey].delivered += amount;
        } else if (order.status === 'pending' || order.status === 'processing' || order.status === 'shipped') {
          acc[monthKey].pending += amount;
        } else if (order.status === 'cancelled') {
          acc[monthKey].cancelled += amount;
        }
        
        return acc;
      }, {} as Record<string, { month: string; delivered: number; pending: number; cancelled: number }>);

      return Object.values(monthlyData)
        .map(item => ({
          name: new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          'Delivered': item.delivered,
          'Pending': item.pending,
          'Cancelled': item.cancelled
        }))
        .slice(-6); // Last 6 months
    },
  });

  // Recent COD orders
  const { data: recentCodOrders, isLoading: isLoadingRecentCodOrders } = useQuery({
    queryKey: ['recent-cod-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number, customer_name, total_amount, status, order_date')
        .eq('payment_method', 'cod')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-yellow-100 text-yellow-800">Shipped</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* COD Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoadingCodSummary ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : (
          codSummary?.map((item) => (
            <Card key={item.status}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">COD - {item.status}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp {item.total.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.count} pesanan
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* COD Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren COD per Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCodByMonth ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={codByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, ""]} />
                <Legend />
                <Bar dataKey="Delivered" stackId="a" fill="#16a34a" />
                <Bar dataKey="Pending" stackId="a" fill="#eab308" />
                <Bar dataKey="Cancelled" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent COD Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pesanan COD Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingRecentCodOrders ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/3" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                recentCodOrders?.map((order) => (
                  <TableRow key={order.order_number}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{getStatusBadge(order.status || 'pending')}</TableCell>
                    <TableCell className="text-right">Rp {order.total_amount?.toLocaleString('id-ID') || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CODReports;
