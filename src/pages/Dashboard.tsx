
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, Users, Package, TrendingDown } from 'lucide-react';
import Layout from '@/components/Layout';

const Dashboard = () => {
  // Stats queries
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);
      
      // Today's sales
      const { data: todaySales } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', today);
      
      const todayRevenue = todaySales?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      
      // This month's sales
      const { data: monthSales } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', thisMonth);
      
      const monthRevenue = monthSales?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      
      // Total customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      // Low stock products
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('current_stock', 10);

      // This month's expenses
      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', thisMonth);
      
      const monthExpensesTotal = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      return {
        todayRevenue,
        monthRevenue,
        customersCount: customersCount || 0,
        lowStockCount: lowStockCount || 0,
        monthExpensesTotal
      };
    }
  });

  // Monthly sales data for chart
  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-sales'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('total_amount, created_at')
        .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());
      
      const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(new Date().getFullYear(), i, 1);
        const monthName = month.toLocaleDateString('id-ID', { month: 'short' });
        const monthData = data?.filter(t => 
          new Date(t.created_at).getMonth() === i
        ) || [];
        const total = monthData.reduce((sum, t) => sum + Number(t.total_amount), 0);
        
        return { month: monthName, sales: total };
      });
      
      return monthlyStats;
    }
  });

  // Category distribution
  const { data: categoryData } = useQuery({
    queryKey: ['category-distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select(`
          categories!inner(name),
          current_stock
        `);
      
      const categoryStats = data?.reduce((acc: any[], product) => {
        const categoryName = product.categories?.name || 'Uncategorized';
        const existing = acc.find(item => item.name === categoryName);
        
        if (existing) {
          existing.value += product.current_stock || 0;
        } else {
          acc.push({ name: categoryName, value: product.current_stock || 0 });
        }
        
        return acc;
      }, []) || [];
      
      return categoryStats;
    }
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats?.todayRevenue.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penjualan Bulan Ini</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats?.monthRevenue.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.customersCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.lowStockCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">Rp {stats?.monthExpensesTotal.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Penjualan Bulanan (Tahun Ini)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Penjualan']} />
                  <Bar dataKey="sales" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Stok per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
