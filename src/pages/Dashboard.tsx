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

  // --- POS: Transaksi POS hari ini ---
  const today = new Date().toISOString().split('T')[0];

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

  // --- COD: Pendapatan COD & Transaksi COD hari ini (orders delivered hari ini) ---
  const { data: codSalesToday } = useQuery({
    queryKey: ['cod-revenue-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_id, customer_name, created_at, status')
        .eq('status', 'delivered')
        .gte('order_date', today + 'T00:00:00')
        .lte('order_date', today + 'T23:59:59');
      if (error) throw error;
      return data;
    }
  });

  // --- Tabel transaksi penjualan hari ini (hanya POS) ---
  const todaySalesTable = (posSales ?? []).map(trx => {
    let customerName = 'Umum';
    if (trx.customer_id) {
      const matchCustomer = customers?.find((c) => c.id === trx.customer_id);
      customerName = matchCustomer?.name || 'Umum';
    }
    return {
      id: trx.id,
      number: trx.transaction_number,
      name: customerName,
      total: trx.total_amount,
      status: 'POS',
      created_at: trx.created_at,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // --- Penjualan hari ini (hanya POS) ---
  const todaySales = todaySalesTable.reduce((sum, trx) => sum + (Number(trx.total) || 0), 0);
  const todayTransactions = todaySalesTable.length;

  // --- Pendapatan COD hari ini ---
  const codIncomeToday = codSalesToday?.reduce((sum, trx) => sum + (Number(trx.total_amount) || 0), 0) || 0;

  // --- COD Sales Table Hari Ini ---
  const codSalesTable = (codSalesToday ?? []).map(trx => ({
    id: trx.id,
    number: trx.order_number,
    name: trx.customer_name || 'Umum',
    total: trx.total_amount,
    status: trx.status,
    created_at: trx.created_at,
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getOrderStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      case 'processing':
         return <Badge className="bg-blue-100 text-blue-800">Diproses</Badge>;
      case 'shipped':
        return <Badge className="bg-yellow-100 text-yellow-800">Dikirim</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Summary cards: calculate stats
  const totalProducts = products?.length || 0;
  const lowStockProducts = lowStock?.length || 0;
  const totalCustomers = customers?.length || 0;
  const monthlyExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
  const pendingOrders = pending?.length || 0;

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
              <CardTitle className="text-xs font-semibold">Pendapatan COD Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-green-600">
                Rp {codIncomeToday?.toLocaleString('id-ID') || '0'}
              </div>
              <p className="text-[10px] text-muted-foreground">COD delivered hari ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Transaksi Penjualan Hari Ini (POS saja) */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-blue-500" />
                Transaksi Penjualan Hari Ini (POS)
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
                          <Badge variant="secondary">
                            POS
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
                        Tidak ada transaksi POS hari ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Transaksi COD Hari Ini */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-green-500" />
                Transaksi COD Hari Ini (Selesai)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">No. Order</TableHead>
                    <TableHead className="text-xs">Pelanggan</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codSalesTable.length > 0 ? (
                    codSalesTable.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs">{order.number}</TableCell>
                        <TableCell className="text-xs">{order.name}</TableCell>
                        <TableCell className="text-xs">
                          {getOrderStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          Rp {Number(order.total)?.toLocaleString('id-ID') || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-xs">
                        Tidak ada transaksi COD selesai hari ini.
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
