import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

const POSSalesReports = () => {
  // Add period filter (default: harian)
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'range'>('harian');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Calculate date filter
  const today = new Date();
  let from = '', to = '';
  if (period === 'harian') {
    from = to = format(today, 'yyyy-MM-dd');
  } else if (period === 'mingguan') {
    from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    to = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  } else if (period === 'bulanan') {
    from = format(startOfMonth(today), 'yyyy-MM-dd');
    to = format(endOfMonth(today), 'yyyy-MM-dd');
  } else if (period === 'tahunan') {
    from = format(startOfYear(today), 'yyyy-MM-dd');
    to = format(endOfYear(today), 'yyyy-MM-dd');
  } else if (period === 'range' && dateRange.from && dateRange.to) {
    from = dateRange.from;
    to = dateRange.to;
  }

  // Sales by time period (transactions)
  const { data: salesByTime, isLoading: isLoadingSalesByTime } = useQuery({
    queryKey: ['pos-sales-by-time', period, dateRange],
    queryFn: async () => {
      let q = supabase.from('transactions').select('created_at, total_amount');
      if (from && to) {
        q = q.gte('created_at', from + 'T00:00:00').lte('created_at', to + 'T23:59:59');
      }
      const { data, error } = await q;
      if (error) throw error;

      const groupedData = data.reduce((acc, trx) => {
        const date = new Date(trx.created_at);
        const key = date.toISOString().split('T')[0];
        if (!acc[key]) {
          acc[key] = { date: key, total: 0, count: 0 };
        }
        acc[key].total += trx.total_amount || 0;
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, { date: string; total: number; count: number }>);

      return Object.values(groupedData).map(item => ({
        name: new Date(item.date).toLocaleDateString('id-ID', {
          month: 'short',
          day: 'numeric',
        }),
        Total: item.total,
        Transaksi: item.count,
      }));
    },
  });

  // Sales by product
  const { data: salesByProduct, isLoading: isLoadingSalesByProduct } = useQuery({
    queryKey: ['pos-sales-by-product', period, dateRange],
    queryFn: async () => {
      let q = supabase
        .from('transaction_items')
        .select(`
          quantity,
          total_price,
          products(name)
        `);
      if (from && to) {
        q = q.gte('created_at', from + 'T00:00:00').lte('created_at', to + 'T23:59:59');
      }
      const { data, error } = await q;
      if (error) throw error;

      const productSales = data.reduce((acc, item) => {
        if (item.products && item.products.name) {
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
    queryKey: ['pos-sales-by-category', period, dateRange],
    queryFn: async () => {
      let q = supabase
        .from('transaction_items')
        .select(`
          total_price,
          products(categories(name))
        `);
      if (from && to) {
        q = q.gte('created_at', from + 'T00:00:00').lte('created_at', to + 'T23:59:59');
      }
      const { data, error } = await q;
      if (error) throw error;

      const categorySales = data.reduce((acc, item) => {
        if (item.products?.categories && item.products.categories.name) {
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

  // Sales by cashier
  const { data: salesByCashier, isLoading: isLoadingSalesByCashier } = useQuery({
    queryKey: ['pos-sales-by-cashier', period, dateRange],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('cashier_id, total_amount, created_at')
        .not('cashier_id', 'is', null);
      if (from && to) {
        q = q.gte('created_at', from + 'T00:00:00').lte('created_at', to + 'T23:59:59');
      }
      const { data, error } = await q;
      if (error) throw error;

      // Group by cashier_id. For demo, show the id, ideally join profiles for full name.
      const cashierSales = data.reduce((acc, trx) => {
        const cashier = trx.cashier_id;
        if (!acc[cashier]) {
          acc[cashier] = { name: cashier, value: 0, count: 0 };
        }
        acc[cashier].value += trx.total_amount || 0;
        acc[cashier].count += 1;
        return acc;
      }, {} as Record<string, { name: string; value: number; count: number }>);

      return Object.values(cashierSales);
    },
  });

  // Sales by payment method
  const { data: salesByPayment, isLoading: isLoadingSalesByPayment } = useQuery({
    queryKey: ['pos-sales-by-payment', period, dateRange],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('payment_type, total_amount, created_at');
      if (from && to) {
        q = q.gte('created_at', from + 'T00:00:00').lte('created_at', to + 'T23:59:59');
      }
      const { data, error } = await q;
      if (error) throw error;

      const paymentSales = data.reduce((acc, trx) => {
        const method = trx.payment_type || 'Unknown';
        if (!acc[method]) {
          acc[method] = { name: method, value: 0, count: 0 };
        }
        acc[method].value += trx.total_amount || 0;
        acc[method].count += 1;
        return acc;
      }, {} as Record<string, { name: string; value: number; count: number }>);

      return Object.values(paymentSales);
    },
  });

  // Sales by hour
  const { data: salesByHour, isLoading: isLoadingSalesByHour } = useQuery({
    queryKey: ['pos-sales-by-hour', period, dateRange],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('created_at, total_amount');
      if (from && to) {
        q = q.gte('created_at', from + 'T00:00:00').lte('created_at', to + 'T23:59:59');
      }
      const { data, error } = await q;
      if (error) throw error;

      const hourSales = data.reduce((acc, trx) => {
        const hour = new Date(trx.created_at).getHours();
        if (!acc[hour]) {
          acc[hour] = { hour: `${hour}:00`, total: 0, count: 0 };
        }
        acc[hour].total += trx.total_amount || 0;
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
      {/* Filter Periode */}
      <div className="flex gap-4 items-center mb-2">
        <Select value={period} onValueChange={val => setPeriod(val as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="harian">Harian</SelectItem>
            <SelectItem value="mingguan">Mingguan</SelectItem>
            <SelectItem value="bulanan">Bulanan</SelectItem>
            <SelectItem value="tahunan">Tahunan</SelectItem>
            <SelectItem value="range">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        {period === 'range' && (
          <>
            <input
              type="date"
              className="border p-1 rounded text-xs"
              value={dateRange.from}
              onChange={e => setDateRange(r => ({
                from: e.target.value,
                to: r.to,
              }))}
            />
            <span>s/d</span>
            <input
              type="date"
              className="border p-1 rounded text-xs"
              value={dateRange.to}
              onChange={e => setDateRange(r => ({
                from: r.from,
                to: e.target.value,
              }))}
            />
          </>
        )}
      </div>
      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Penjualan POS</CardTitle>
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
        {/* By Product & By Category */}
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
        {/* By Cashier & By Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Kasir</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesByCashier ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kasir</TableHead>
                    <TableHead className="text-right">Jumlah Transaksi</TableHead>
                    <TableHead className="text-right">Total Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByCashier?.map((cashier) => (
                    <TableRow key={cashier.name}>
                      <TableCell className="font-medium">{cashier.name}</TableCell>
                      <TableCell className="text-right">{cashier.count}</TableCell>
                      <TableCell className="text-right">Rp {cashier.value.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Hour */}
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
          <CardTitle>Produk Terlaris POS</CardTitle>
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

export default POSSalesReports;
