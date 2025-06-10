
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, CreditCard } from 'lucide-react';
import Layout from '@/components/Layout';

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: totalCustomers },
        { count: todayTransactions },
        { data: lowStockProducts },
        { data: todaySales },
        { count: creditTransactions }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('products').select('name, current_stock, min_stock').lt('current_stock', 10),
        supabase.from('transactions').select('total_amount').gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('is_credit', true).eq('paid_amount', 0)
      ]);

      const totalSales = todaySales?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

      return {
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        todayTransactions: todayTransactions || 0,
        lowStockProducts: lowStockProducts || [],
        totalSales,
        creditTransactions: creditTransactions || 0
      };
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Dashboard</h1>
          <p className="text-gray-600">Selamat datang di WaroengKami</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">Produk terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Member terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayTransactions || 0}</div>
              <p className="text-xs text-muted-foreground">Penjualan hari ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats?.totalSales?.toLocaleString('id-ID') || 0}</div>
              <p className="text-xs text-muted-foreground">Total omzet</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Stok Menipis
              </CardTitle>
              <CardDescription>Produk dengan stok di bawah minimum</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.lowStockProducts?.length ? (
                <div className="space-y-2">
                  {stats.lowStockProducts.slice(0, 5).map((product: any, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-orange-600">
                        {product.current_stock}/{product.min_stock}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Semua produk stok aman</p>
              )}
            </CardContent>
          </Card>

          {/* Credit Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-500" />
                Piutang Belum Lunas
              </CardTitle>
              <CardDescription>Transaksi kredit yang belum dibayar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.creditTransactions || 0} transaksi
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Memerlukan tindak lanjut pembayaran
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
