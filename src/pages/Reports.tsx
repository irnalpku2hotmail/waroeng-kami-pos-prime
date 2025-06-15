
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const Reports = () => {
  // Query for daily sales report (last 30 days)
  const { data: dailySales, isLoading: isLoadingDailySales } = useQuery({
    queryKey: ['daily-sales-report'],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const { data, error } = await supabase
        .from('orders')
        .select('order_date, total_amount')
        .gte('order_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('order_date', { ascending: true });

      if (error) throw error;

      const salesByDay = data.reduce((acc, order) => {
        const date = order.order_date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += order.total_amount || 0;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(salesByDay).map(([date, total]) => ({
        name: new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        Total: total,
      }));
    },
  });

  // Query for best selling products
  const { data: bestSellingProducts, isLoading: isLoadingBestSelling } = useQuery({
    queryKey: ['best-selling-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('order_items').select('quantity, products(id, name)');

      if (error) throw error;

      const productSales = data.reduce((acc, item) => {
        if (item.products) {
          const { id, name } = item.products;
          if (!acc[id]) {
            acc[id] = { name, quantity: 0 };
          }
          acc[id].quantity += item.quantity || 0;
        }
        return acc;
      }, {} as Record<string, { name: string; quantity: number }>);

      return Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    },
  });

  // Query for top customers
  const { data: topCustomers, isLoading: isLoadingTopCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('customer_name, total_amount');

      if (error) throw error;

      const customerSpending = data.reduce((acc, order) => {
        if (order.customer_name) {
          if (!acc[order.customer_name]) {
            acc[order.customer_name] = { name: order.customer_name, total: 0 };
          }
          acc[order.customer_name].total += order.total_amount || 0;
        }
        return acc;
      }, {} as Record<string, { name: string; total: number }>);

      return Object.values(customerSpending)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Laporan</h1>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Laporan Penjualan Harian (30 Hari Terakhir)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingDailySales ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, "Total"]} />
                  <Legend />
                  <Bar dataKey="Total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Jumlah Terjual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingBestSelling
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    : bestSellingProducts?.map((product) => (
                        <TableRow key={product.name}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pelanggan Teratas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead className="text-right">Total Belanja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTopCustomers
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    : topCustomers?.map((customer) => (
                        <TableRow key={customer.name}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell className="text-right">Rp {customer.total.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;

