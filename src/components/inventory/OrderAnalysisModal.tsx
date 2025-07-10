
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, Package, AlertTriangle } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const OrderAnalysisModal = ({ open, onOpenChange, product }: OrderAnalysisModalProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch order analytics
  const { data: analytics } = useQuery({
    queryKey: ['order-analytics', product?.id, timeRange],
    queryFn: async () => {
      if (!product?.id) return null;

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Get transaction items for this product
      const { data: transactionItems, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          created_at,
          transactions!inner(
            created_at,
            total_amount
          )
        `)
        .eq('product_id', product.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get order items for this product
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          created_at,
          orders!inner(
            created_at,
            status,
            total_amount
          )
        `)
        .eq('product_id', product.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      return {
        transactionItems: transactionItems || [],
        orderItems: orderItems || []
      };
    },
    enabled: !!product?.id && open
  });

  const calculateStats = () => {
    if (!analytics) return null;

    const totalSold = (analytics.transactionItems?.reduce((sum, item) => sum + item.quantity, 0) || 0) +
                     (analytics.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0);

    const totalRevenue = (analytics.transactionItems?.reduce((sum, item) => sum + item.total_price, 0) || 0) +
                        (analytics.orderItems?.reduce((sum, item) => sum + item.total_price, 0) || 0);

    const avgDailySales = totalSold / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);
    
    // Calculate days until stock runs out based on current trend
    const daysUntilStockOut = avgDailySales > 0 ? product.current_stock / avgDailySales : Infinity;

    // Determine trend
    const recentSales = analytics.transactionItems?.filter(item => 
      new Date(item.created_at) >= subDays(new Date(), Math.floor((timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90) / 2))
    ).reduce((sum, item) => sum + item.quantity, 0) || 0;

    const olderSales = totalSold - recentSales;
    const trend = recentSales > olderSales ? 'up' : recentSales < olderSales ? 'down' : 'stable';

    return {
      totalSold,
      totalRevenue,
      avgDailySales,
      daysUntilStockOut,
      trend,
      recentTransactions: analytics.transactionItems?.slice(0, 10) || [],
      recentOrders: analytics.orderItems?.slice(0, 10) || []
    };
  };

  const stats = calculateStats();

  const getRecommendation = () => {
    if (!stats) return null;

    if (stats.daysUntilStockOut < 7) {
      return {
        type: 'urgent',
        message: 'Stok akan habis dalam waktu kurang dari 7 hari! Segera lakukan pemesanan.',
        action: 'Pesan Sekarang'
      };
    } else if (stats.daysUntilStockOut < 14) {
      return {
        type: 'warning',
        message: 'Stok akan habis dalam 2 minggu. Pertimbangkan untuk memesan stok tambahan.',
        action: 'Rencanakan Pemesanan'
      };
    } else if (stats.trend === 'up') {
      return {
        type: 'info',
        message: 'Penjualan produk ini sedang meningkat. Pertimbangkan untuk menambah stok.',
        action: 'Tingkatkan Stok'
      };
    } else {
      return {
        type: 'success',
        message: 'Stok produk masih aman untuk saat ini.',
        action: 'Monitor Terus'
      };
    }
  };

  const recommendation = getRecommendation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analisis Order - {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[
              { key: '7d', label: '7 Hari' },
              { key: '30d', label: '30 Hari' },
              { key: '90d', label: '90 Hari' }
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Total Terjual</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalSold}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Rata-rata/Hari</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.avgDailySales.toFixed(1)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {stats.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : stats.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="text-sm text-gray-600">Trend</span>
                    </div>
                    <p className="text-lg font-bold capitalize">
                      {stats.trend === 'up' ? 'Naik' : stats.trend === 'down' ? 'Turun' : 'Stabil'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Estimasi Habis</span>
                    </div>
                    <p className="text-lg font-bold">
                      {stats.daysUntilStockOut === Infinity 
                        ? 'Tidak terbatas' 
                        : `${Math.ceil(stats.daysUntilStockOut)} hari`
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendation */}
              {recommendation && (
                <Card className={`border-l-4 ${
                  recommendation.type === 'urgent' ? 'border-red-500 bg-red-50' :
                  recommendation.type === 'warning' ? 'border-orange-500 bg-orange-50' :
                  recommendation.type === 'info' ? 'border-blue-500 bg-blue-50' :
                  'border-green-500 bg-green-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-2">Rekomendasi</h4>
                        <p className="text-sm text-gray-700">{recommendation.message}</p>
                      </div>
                      <Badge variant={
                        recommendation.type === 'urgent' ? 'destructive' :
                        recommendation.type === 'warning' ? 'destructive' :
                        'secondary'
                      }>
                        {recommendation.action}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Tabs defaultValue="transactions" className="w-full">
                <TabsList>
                  <TabsTrigger value="transactions">Transaksi POS</TabsTrigger>
                  <TabsTrigger value="orders">Order Online</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaksi POS Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.recentTransactions.length > 0 ? (
                        <div className="space-y-2">
                          {stats.recentTransactions.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{item.quantity} unit</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                </p>
                              </div>
                              <p className="font-semibold">
                                Rp {item.total_price.toLocaleString('id-ID')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Tidak ada transaksi dalam periode ini</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Online Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.recentOrders.length > 0 ? (
                        <div className="space-y-2">
                          {stats.recentOrders.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{item.quantity} unit</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  {item.orders.status}
                                </Badge>
                              </div>
                              <p className="font-semibold">
                                Rp {item.total_price.toLocaleString('id-ID')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Tidak ada order dalam periode ini</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderAnalysisModal;
