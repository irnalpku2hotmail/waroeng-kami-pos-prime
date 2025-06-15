import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  History,
  Wifi
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePresence } from '@/contexts/PresenceContext';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fetching helper
const getDateRange = (type: string) => {
  const today = new Date();
  if (type === "month") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0]
    };
  }
  return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
};

const Dashboard = () => {
  const { onlineUsers } = usePresence();

  // Total produk
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Produk stok rendah
  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .lt('current_stock', 10);
      if (error) throw error;
      return data;
    }
  });

  // Total pelanggan
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Pengeluaran bulanan
  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', firstDayOfMonth)
        .lte('expense_date', lastDayOfMonth);
      if (error) throw error;
      return data;
    }
  });

  // Pesanan tertunda
  const { data: pending } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending');
      if (error) throw error;
      return data;
    }
  });

  // Pendapatan COD (orders delivered dalam bulan ini)
  const { data: codRevenue } = useQuery({
    queryKey: ['cod-revenue'],
    queryFn: async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('order_date', firstDayOfMonth)
        .lte('order_date', lastDayOfMonth)
        .eq('status', 'delivered');
      if (error) throw error;
      return data;
    }
  });

  // Today's Orders untuk aktivitas, masih pakai orders table (COD)
  const { data: todaysOrders, isLoading: isLoadingTodaysOrders } = useQuery({
    queryKey: ['todays-orders'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total_amount, status')
        .eq('order_date', today)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Today's Sales/Transactions for POS
  const { data: posSales } = useQuery({
    queryKey: ['pos-daily-sales'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('transactions')
        .select('id, transaction_number, total_amount, customer_id, created_at')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');
      if (error) throw error;
      return data;
    }
  });

  // Today's Sales/Transactions for COD (orders)
  const { data: codSales } = useQuery({
    queryKey: ['cod-daily-sales'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_name, created_at')
        .eq('order_date', today);
      if (error) throw error;
      return data;
    }
  });

  // Combine POS and COD for activity table
  const todaySalesTable = [
    ...(posSales?.map((trx) => ({
      id: trx.id,
      number: trx.transaction_number,
      name: trx.customer_id ? `Pelanggan #${trx.customer_id.slice(-4)}` : 'Umum',
      total: trx.total_amount,
      status: 'POS',
      created_at: trx.created_at,
    })) ?? []),
    ...(codSales?.map((ord) => ({
      id: ord.id,
      number: ord.order_number,
      name: ord.customer_name,
      total: ord.total_amount,
      status: 'COD',
      created_at: ord.created_at,
    })) ?? []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // For line chart: get last 7 days POS and COD sales
  const { data: posVsCod7Days } = useQuery({
    queryKey: ['pos-vs-cod-7days'],
    queryFn: async () => {
      const days = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      // POS per day
      const { data: posRaw, error: e1 } = await supabase
        .from('transactions')
        .select('created_at, total_amount')
        .gte('created_at', days[0] + 'T00:00:00')
        .lte('created_at', days[6] + 'T23:59:59');

      // COD per day
      const { data: codRaw, error: e2 } = await supabase
        .from('orders')
        .select('order_date, total_amount')
        .gte('order_date', days[0])
        .lte('order_date', days[6]);

      if (e1) throw e1;
      if (e2) throw e2;

      const posDay = Object.fromEntries(days.map(d=>[d,0]));
      for(const trx of posRaw??[]) {
        const d = trx.created_at.split('T')[0];
        if (posDay[d]!==undefined) posDay[d] += trx.total_amount ?? 0;
      }
      const codDay = Object.fromEntries(days.map(d=>[d,0]));
      for(const o of codRaw??[]) {
        const d = o.order_date.split('T')[0];
        if (codDay[d]!==undefined) codDay[d] += o.total_amount ?? 0;
      }
      return days.map(d => ({
        date: d,
        POS: posDay[d] || 0,
        COD: codDay[d] || 0,
      }));
    }
  });

  const totalProducts = products?.length || 0;
  const lowStockProducts = lowStock?.length || 0;
  const totalCustomers = customers?.length || 0;
  const todaySales = posSales?.reduce((sum, trx) => sum + (trx.total_amount || 0), 0) || 0;
  const todayTransactions = todaysOrders?.length || 0;
  const monthlyExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
  const pendingOrders = pending?.length || 0;
  const codIncome = codRevenue?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  const getStatusBadge = (status: string | null) => {
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
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Dashboard</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                {lowStockProducts} produk stok rendah
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalCustomers}
              </div>
              <p className="text-xs text-muted-foreground">Pelanggan terdaftar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penjualan Hari Ini (POS)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                Rp {todaySales?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-xs text-muted-foreground">Dari {todayTransactions} transaksi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Bulanan</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {monthlyExpenses?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total bulan ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly COD Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Pendapatan COD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-2">
                Rp {codIncome?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-sm text-gray-600">COD delivered bulan ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Peringatan Stok Rendah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {lowStockProducts}
              </div>
              <p className="text-sm text-gray-600">Produk perlu diisi ulang</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                Pesanan Tertunda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {pendingOrders}
              </div>
              <p className="text-sm text-gray-600">Pesanan menunggu diproses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-teal-500" />
                Pengguna Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600 mb-2">
                {onlineUsers}
              </div>
              <p className="text-sm text-gray-600">Pengguna aktif saat ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Garfik POS vs COD */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-blue-900">Tren Penjualan POS vs COD (7 Hari Terakhir)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={posVsCod7Days ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={v=>`Rp ${Number(v).toLocaleString('id-ID')}`} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="POS" stroke="#2563eb" name="POS" />
                <Line type="monotone" dataKey="COD" stroke="#16a34a" name="COD" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Sales Activity: Now Combined POS + COD */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Transaksi Penjualan Hari Ini (POS & COD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Transaksi</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySalesTable.length > 0 ? (
                    todaySalesTable.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.number}</TableCell>
                        <TableCell>{order.name}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === "POS" ? "secondary" : "default"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {order.total?.toLocaleString('id-ID') || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Tidak ada transaksi hari ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
