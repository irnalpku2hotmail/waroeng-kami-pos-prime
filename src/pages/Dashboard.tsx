
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { ShoppingCart, DollarSign, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Today's sales
      const { data: todaySales } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', today);
      
      // Today's transactions count
      const { data: todayTransactions } = await supabase
        .from('transactions')
        .select('id')
        .gte('created_at', today);
      
      // Total products
      const { data: products } = await supabase
        .from('products')
        .select('id');
      
      // Total customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id');
      
      // Low stock products
      const { data: lowStock } = await supabase
        .from('products')
        .select('*')
        .lt('current_stock', 10);
      
      return {
        todaySales: todaySales?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0,
        todayTransactions: todayTransactions?.length || 0,
        totalProducts: products?.length || 0,
        totalCustomers: customers?.length || 0,
        lowStockCount: lowStock?.length || 0,
        lowStockProducts: lowStock || []
      };
    }
  });

  // Fetch today's transactions
  const { data: todayTransactionsList } = useQuery({
    queryKey: ['today-transactions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name),
          profiles(full_name)
        `)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch sales chart data (last 7 days)
  const { data: salesChart } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data } = await supabase
        .from('transactions')
        .select('total_amount, created_at')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      // Group by date
      const grouped = data?.reduce((acc: any, transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString('id-ID');
        acc[date] = (acc[date] || 0) + Number(transaction.total_amount);
        return acc;
      }, {});
      
      return Object.entries(grouped || {}).map(([date, amount]) => ({
        date,
        amount: Number(amount)
      }));
    }
  });

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const getPaymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      transfer: 'bg-purple-100 text-purple-800',
      e_wallet: 'bg-orange-100 text-orange-800'
    };
    
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">Dashboard</h1>
          <p className="text-gray-600">Welcome to your SmartPOS dashboard</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.todaySales || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.todayTransactions || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalProducts || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalCustomers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.lowStockCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Low Stock Products
              </CardTitle>
              <CardDescription>Products with stock below 10 units</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.lowStockProducts?.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(product.selling_price)}</p>
                    </div>
                    <Badge variant="destructive">{product.current_stock} left</Badge>
                  </div>
                ))}
                {!stats?.lowStockProducts?.length && (
                  <p className="text-gray-500 text-center py-4">All products have sufficient stock</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Sales Transactions</CardTitle>
            <CardDescription>Latest transactions from today</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayTransactionsList?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.transaction_number}</TableCell>
                    <TableCell>{transaction.customers?.name || 'Walk-in Customer'}</TableCell>
                    <TableCell>{transaction.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell>{getPaymentTypeBadge(transaction.payment_type)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(transaction.total_amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!todayTransactionsList?.length && (
              <div className="text-center py-8 text-gray-500">
                No transactions today yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
