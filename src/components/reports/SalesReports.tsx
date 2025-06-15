
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const SalesReports = () => {
  const [timeFilter, setTimeFilter] = useState('daily');
  const [dateRange, setDateRange] = useState('30');

  // Sales by time period
  const { data: salesByTime, isLoading: isLoadingSalesByTime } = useQuery({
    queryKey: ['sales-by-time', timeFilter, dateRange],
    queryFn: async () => {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('orders')
        .select('order_date, total_amount, created_at')
        .gte('order_date', startDate.toISOString().split('T')[0])
        .order('order_date', { ascending: true });

      if (error) throw error;

      const groupedData = data.reduce((acc, order) => {
        let key;
        const date = new Date(order.order_date);
        
        switch (timeFilter) {
          case 'daily':
            key = order.order_date;
            break;
          case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            key = date.getFullYear().toString();
            break;
          default:
            key = order.order_date;
        }

        if (!acc[key]) {
          acc[key] = { date: key, total: 0, count: 0 };
        }
        acc[key].total += order.total_amount || 0;
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, { date: string; total: number; count: number }>);

      return Object.values(groupedData).map(item => ({
        name: new Date(item.date).toLocaleDateString('id-ID', { 
          month: 'short', 
          day: timeFilter === 'daily' ? 'numeric' : undefined,
          year: timeFilter === 'yearly' ? 'numeric' : undefined
        }),
        Total: item.total,
        Transaksi: item.count
      }));
    },
  });

  // Sales by product
  const { data: salesByProduct, isLoading: isLoadingSalesByProduct } = useQuery({
    queryKey: ['sales-by-product'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products(name)
        `);

      if (error) throw error;

      const productSales = data.reduce((acc, item) => {
        if (item.products) {
          const name = item.products.name;
          if (!acc[name]) {
            acc[name] = { name, quantity: 0, revenue: 0 };
          }
          acc[name].quantity += item.quantity || 0;
          acc[name].revenue += item.total_price || 0;
        }
        return acc;
      }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

      return Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    },
  });

  // Sales by category
  const { data: salesByCategory, isLoading: isLoadingSalesByCategory } = useQuery({
    queryKey: ['sales-by-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          total_price,
          products(categories(name))
        `);

      if (error) throw error;

      const categorySales = data.reduce((acc, item) => {
        if (item.products?.categories) {
          const categoryName = item.products.categories.name;
          if (!acc[categoryName]) {
            acc[categoryName] = { name: categoryName, value: 0 };
          }
          acc[categoryName].value += item.total_price || 0;
        }
        return acc;
      }, {} as Record<string, { name: string; value: number }>);

      return Object.values(categorySales);
    },
  });

  // Sales by payment method
  const { data: salesByPayment, isLoading: isLoadingSalesByPayment } = useQuery({
    queryKey: ['sales-by-payment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_method, total_amount');

      if (error) throw error;

      const paymentSales = data.reduce((acc, order) => {
        const method = order.payment_method || 'Unknown';
        if (!acc[method]) {
          acc[method] = { name: method, value: 0, count: 0 };
        }
        acc[method].value += order.total_amount || 0;
        acc[method].count += 1;
        return acc;
      }, {} as Record<string, { name: string; value: number; count: number }>);

      return Object.values(paymentSales);
    },
  });

  // Sales by hour
  const { data: salesByHour, isLoading: isLoadingSalesByHour } = useQuery({
    queryKey: ['sales-by-hour'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount');

      if (error) throw error;

      const hourSales = data.reduce((acc, order) => {
        const hour = new Date(order.created_at).getHours();
        if (!acc[hour]) {
          acc[hour] = { hour: `${hour}:00`, total: 0, count: 0 };
        }
        acc[hour].total += order.total_amount || 0;
        acc[hour].count += 1;
        return acc;
      }, {} as Record<number, { hour: string; total: number; count: number }>);

      return Array.from({ length: 24 }, (_, i) => 
        hourSales[i] || { hour: `${i}:00`, total: 0, count: 0 }
      );
    },
  });

  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#c2410c'];

  return (
    <div className="space-y-6">
      {/* Time Period Controls */}
      <div className="flex gap-4">
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Harian</SelectItem>
            <SelectItem value="weekly">Mingguan</SelectItem>
            <SelectItem value="monthly">Bulanan</SelectItem>
            <SelectItem value="yearly">Tahunan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih rentang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Hari Terakhir</SelectItem>
            <SelectItem value="30">30 Hari Terakhir</SelectItem>
            <SelectItem value="90">3 Bulan Terakhir</SelectItem>
            <SelectItem value="365">1 Tahun Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Penjualan {timeFilter === 'daily' ? 'Harian' : timeFilter === 'weekly' ? 'Mingguan' : timeFilter === 'monthly' ? 'Bulanan' : 'Tahunan'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSalesByTime ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={salesByTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                <Tooltip formatter={(value, name) => [
                  name === 'Total' ? `Rp ${Number(value).toLocaleString('id-ID')}` : value,
                  name === 'Total' ? 'Penjualan' : 'Transaksi'
                ]} />
                <Legend />
                <Area type="monotone" dataKey="Total" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Transaksi" stackId="2" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Produk</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesByProduct ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByProduct}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesByCategory ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByCategory?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, "Total"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesByPayment ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead className="text-right">Jumlah Transaksi</TableHead>
                    <TableHead className="text-right">Total Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByPayment?.map((payment) => (
                    <TableRow key={payment.name}>
                      <TableCell className="font-medium">{payment.name}</TableCell>
                      <TableCell className="text-right">{payment.count}</TableCell>
                      <TableCell className="text-right">Rp {payment.value.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sales by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Jam</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesByHour ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, "Penjualan"]} />
                  <Bar dataKey="total" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best Selling Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Kuantitas Terjual</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingSalesByProduct ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                salesByProduct?.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">Rp {product.revenue.toLocaleString('id-ID')}</TableCell>
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

export default SalesReports;
