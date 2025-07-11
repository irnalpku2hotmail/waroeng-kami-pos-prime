
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';

interface StockLevelDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const StockLevelDetailsModal = ({ open, onOpenChange, product }: StockLevelDetailsModalProps) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  // Fetch sales data for the product
  const { data: salesData = [] } = useQuery({
    queryKey: ['product-sales', product?.id, timeRange],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const daysBack = timeRange === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          created_at,
          transactions(created_at, total_amount)
        `)
        .eq('product_id', product.id)
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Group by date
      const grouped = data?.reduce((acc: any, item: any) => {
        const date = new Date(item.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, quantity: 0, revenue: 0 };
        }
        acc[date].quantity += Number(item.quantity) || 0;
        acc[date].revenue += Number(item.transactions?.total_amount) || 0;
        return acc;
      }, {});
      
      return Object.values(grouped || {});
    },
    enabled: !!product?.id
  });

  // Fetch purchase history
  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['product-purchases', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          *,
          purchases(purchase_date, supplier_id, suppliers(name))
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.id
  });

  // Fetch stock adjustments
  const { data: stockAdjustments = [] } = useQuery({
    queryKey: ['product-adjustments', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.id
  });

  if (!product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStockStatus = () => {
    const stock = Number(product.current_stock) || 0;
    const minStock = Number(product.min_stock) || 0;
    
    if (stock === 0) return { status: 'Habis', color: 'destructive' };
    if (stock <= minStock) return { status: 'Rendah', color: 'destructive' };
    if (stock <= minStock * 2) return { status: 'Sedang', color: 'secondary' };
    return { status: 'Aman', color: 'default' };
  };

  const expiringItems = purchaseHistory.filter(item => {
    if (!item.expiration_date) return false;
    const expDate = new Date(item.expiration_date);
    const today = new Date();
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detail Stok: {product.name}
            <Badge variant={getStockStatus().color as any}>
              {getStockStatus().status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Penjualan</TabsTrigger>
            <TabsTrigger value="purchases">Pembelian</TabsTrigger>
            <TabsTrigger value="adjustments">Penyesuaian</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Stok Saat Ini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{product.current_stock}</div>
                  <div className="text-sm text-gray-500">Min: {product.min_stock}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Harga Jual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(product.selling_price)}</div>
                  <div className="text-sm text-gray-500">Base: {formatCurrency(product.base_price)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{product.categories?.name || 'Tidak ada'}</div>
                  <div className="text-sm text-gray-500">Unit: {product.units?.abbreviation || 'pcs'}</div>
                </CardContent>
              </Card>
            </div>

            {expiringItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                    Item Mendekati Kadaluarsa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiringItems.map((item, index) => {
                      const expDate = new Date(item.expiration_date);
                      const today = new Date();
                      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-orange-600 font-medium">
                            {diffDays} hari lagi ({expDate.toLocaleDateString()})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 rounded ${timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 rounded ${timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                30 Hari
              </button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Grafik Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#3B82F6" name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Pembelian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {purchaseHistory.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Qty: {item.quantity}</div>
                        <div className="text-sm text-gray-500">
                          {item.purchases?.suppliers?.name} - {new Date(item.purchases?.purchase_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.total_cost)}</div>
                        {item.expiration_date && (
                          <div className="text-sm text-gray-500">
                            Exp: {new Date(item.expiration_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Penyesuaian Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockAdjustments.map((adjustment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          {adjustment.adjustment_type === 'increase' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {adjustment.adjustment_type === 'increase' ? '+' : ''}
                            {adjustment.quantity_change}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {adjustment.profiles?.full_name} - {new Date(adjustment.created_at).toLocaleDateString()}
                        </div>
                        {adjustment.reason && (
                          <div className="text-sm text-gray-600">{adjustment.reason}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {adjustment.previous_stock} → {adjustment.new_stock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StockLevelDetailsModal;
