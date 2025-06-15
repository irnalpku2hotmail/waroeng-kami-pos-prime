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
  AlertTriangle
} from 'lucide-react';
import Layout from '@/components/Layout';

const Dashboard = () => {
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

  const totalProducts = products?.length || 0;
  const lowStockProducts = lowStock?.length || 0;
  const totalCustomers = customers?.length || 0;
  const todaySales = sales?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const todayTransactions = transactions?.length || 0;
  const monthlyExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
  const pendingOrders = pending?.length || 0;
  const monthlyRevenue = revenue?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
