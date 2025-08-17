
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ShoppingCart, Package, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { profile } = useAuth();

  // Redirect buyers to frontend
  if (profile?.role === 'buyer') {
    return <Navigate to="/" replace />;
  }

  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: totalCustomers },
        { count: pendingOrders },
        { data: lowStockProducts }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('id, name, current_stock, min_stock').lt('current_stock', 10)
      ]);

      return {
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        pendingOrders: pendingOrders || 0,
        lowStockProducts: lowStockProducts || []
      };
    }
  });

  // Fetch recent orders
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: 'Total Produk',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Pelanggan',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pesanan Pending',
      value: stats?.pendingOrders || 0,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Stok Rendah',
      value: stats?.lowStockProducts?.length || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Selamat datang di panel admin</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {profile?.role?.toUpperCase()}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.bgColor} p-3 rounded-full`}>
                    <IconComponent className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pesanan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada pesanan</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {order.total_amount?.toLocaleString('id-ID')}</p>
                      <Badge variant={order.status === 'pending' ? 'destructive' : 'default'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Produk Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.lowStockProducts?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Semua produk stok aman</p>
              ) : (
                stats?.lowStockProducts?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">Min: {product.min_stock}</p>
                    </div>
                    <Badge variant="destructive">
                      {product.current_stock} tersisa
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
