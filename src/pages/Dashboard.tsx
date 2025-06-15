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

  // Modify today's orders and sales for POS and only COD with delivered status
  const today = new Date().toISOString().split('T')[0];

  // Transaksi POS hari ini
  const { data: posSales } = useQuery({
    queryKey: ['pos-daily-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, transaction_number, total_amount, customer_id, created_at')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');
      if (error) throw error;
      return data;
    }
  });

  // Transaksi COD hari ini (orders dengan status delivered & tanggal hari ini)
  const { data: codSales } = useQuery({
    queryKey: ['cod-daily-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_name, created_at, status, order_date')
        .eq('status', 'delivered')
        .gte('order_date', today + 'T00:00:00')
        .lte('order_date', today + 'T23:59:59');
      if (error) throw error;
      return data;
    }
  });

  // --- Gabungkan semua transaksi hari ini ---
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
      name: ord.customer_name ?? '-',
      total: ord.total_amount,
      status: 'COD',
      created_at: ord.created_at,
    })) ?? []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // --- Kalkulasi summary hari ini ---
  const todaySales = todaySalesTable.reduce((sum, trx) => sum + (Number(trx.total) || 0), 0);
  const todayTransactions = todaySalesTable.length;

  // Summary cards: calculate stats
  const totalProducts = products?.length || 0;
  const lowStockProducts = lowStock?.length || 0;
  const totalCustomers = customers?.length || 0;
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
        <h1 className="text-2xl lg:text-3xl font-bold text-blue-800 mb-2">Dashboard</h1>

        {/* Cleaner, smaller summary card style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-blue-600">{totalProducts}</div>
              <p className="text-[10px] text-muted-foreground">{lowStockProducts} produk stok rendah</p>
            </CardContent>
          </Card>
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Total Pelanggan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-green-600">{totalCustomers}</div>
              <p className="text-[10px] text-muted-foreground">Pelanggan terdaftar</p>
            </CardContent>
          </Card>
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Penjualan Hari Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-purple-600">
                Rp {todaySales?.toLocaleString('id-ID') || '0'}
              </div>
              <p className="text-[10px] text-muted-foreground">Dari {todayTransactions} transaksi</p>
            </CardContent>
          </Card>
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Pendapatan COD</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-green-600">
                Rp {codIncome?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-[10px] text-muted-foreground">COD delivered bulan ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Remove Garfik POS vs COD here! */}

        {/* Today's Sales Activity, show POS vs COD */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-blue-500" />
                Transaksi Penjualan Hari Ini (POS & COD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">No. Transaksi</TableHead>
                    <TableHead className="text-xs">Pelanggan</TableHead>
                    <TableHead className="text-xs">Tipe</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySalesTable.length > 0 ? (
                    todaySalesTable.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs">{order.number}</TableCell>
                        <TableCell className="text-xs">{order.name}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={order.status === "POS" ? "secondary" : "default"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          Rp {Number(order.total)?.toLocaleString('id-ID') || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-xs">
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
