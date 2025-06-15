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

const Dashboard = () => {
  const { onlineUsers } = usePresence();

  // Fetch total products
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

  // Fetch low stock products
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

  // Fetch total customers
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

  // Fetch today's sales
  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('order_date', today);
      if (error) throw error;
      return data;
    }
  });

  // Fetch today's transactions
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('order_date', today);
      if (error) throw error;
      return data;
    }
  });

  // Fetch monthly expenses
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

  // Fetch pending orders
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

  // Fetch monthly revenue
  const { data: revenue } = useQuery({
    queryKey: ['monthly-revenue'],
    queryFn: async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('order_date', firstDayOfMonth)
        .lte('order_date', lastDayOfMonth);
      if (error) throw error;
      return data;
    }
  });

  // Fetch today's orders for the activity list
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

  const totalProducts = products?.length || 0;
  const lowStockProducts = lowStock?.length || 0;
  const totalCustomers = customers?.length || 0;
  const todaySales = sales?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const todayTransactions = transactions?.length || 0;
  const monthlyExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
  const pendingOrders = pending?.length || 0;
  const monthlyRevenue = revenue?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

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
              <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
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

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <TrendingUp className="h-5 w-5 text-green-500" />
                Pendapatan Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-2">
                Rp {monthlyRevenue?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-sm text-gray-600">Total bulan ini</p>
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

        {/* Today's Sales Activity */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Transaksi Penjualan Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTodaysOrders ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : todaysOrders && todaysOrders.length > 0 ? (
                    todaysOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          Rp {order.total_amount?.toLocaleString('id-ID') || 0}
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
