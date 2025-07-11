
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Package, AlertTriangle } from 'lucide-react';

interface StockLevelDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const StockLevelDetailsModal = ({ open, onOpenChange, product }: StockLevelDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState('weekly');

  // Fetch sales data for the product
  const { data: salesData = [] } = useQuery({
    queryKey: ['product-sales', product?.id, activeTab],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const daysBack = activeTab === 'weekly' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          created_at,
          transactions!inner(created_at)
        `)
        .eq('product_id', product.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Group data by day
      const groupedData = data.reduce((acc: any, item) => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, quantity: 0, sales: 0 };
        }
        acc[date].quantity += item.quantity;
        acc[date].sales += 1;
        return acc;
      }, {});
      
      return Object.values(groupedData);
    },
    enabled: !!product?.id && open
  });

  // Fetch purchase history for expiration analysis
  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['product-purchases', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          *,
          purchases!inner(purchase_date, supplier_id, suppliers(name))
        `)
        .eq('product_id', product.id)
        .order('expiration_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.id && open
  });

  // Calculate next order recommendation
  const getNextOrderRecommendation = () => {
    if (!salesData.length || !purchaseHistory.length) return null;
    
    // Calculate average daily sales
    const totalSales = salesData.reduce((sum: number, day: any) => sum + (Number(day.quantity) || 0), 0);
    const avgDailySales = totalSales / salesData.length;
    
    // Find items with expiration dates
    const itemsWithExpiry = purchaseHistory.filter(item => item.expiration_date);
    
    if (itemsWithExpiry.length === 0) return null;
    
    // Calculate days until next expiration
    const nextExpiry = new Date(itemsWithExpiry[0].expiration_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((nextExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate recommended order quantity
    const safetyStock = product.min_stock || 10;
    const leadTime = 7; // Assume 7 days lead time
    const recommendedOrder = Math.max(0, (avgDailySales * (daysUntilExpiry + leadTime)) - product.current_stock + safetyStock);
    
    return {
      daysUntilExpiry,
      avgDailySales: Math.round(avgDailySales * 10) / 10,
      recommendedOrder: Math.ceil(recommendedOrder),
      nextExpiryDate: nextExpiry.toLocaleDateString('id-ID')
    };
  };

  const recommendation = getNextOrderRecommendation();

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detail Analisis Stok - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Stock Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stok Saat Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {product.current_stock} {product.units?.abbreviation}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stok Minimum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {product.min_stock} {product.units?.abbreviation}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  product.current_stock <= 0 ? 'text-red-600' :
                  product.current_stock <= product.min_stock ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {product.current_stock <= 0 ? 'Habis' :
                   product.current_stock <= product.min_stock ? 'Rendah' : 'Normal'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Grafik Penjualan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                  <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab}>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('id-ID', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString('id-ID')}
                          formatter={(value, name) => [value, name === 'quantity' ? 'Terjual' : 'Transaksi']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="quantity" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Order Recommendation */}
          {recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rekomendasi Order Berikutnya
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tanggal Kadaluarsa Terdekat:</span>
                      <span className="font-medium">{recommendation.nextExpiryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hari Hingga Kadaluarsa:</span>
                      <span className={`font-medium ${
                        recommendation.daysUntilExpiry <= 7 ? 'text-red-600' :
                        recommendation.daysUntilExpiry <= 14 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {recommendation.daysUntilExpiry} hari
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rata-rata Penjualan Harian:</span>
                      <span className="font-medium">{recommendation.avgDailySales} unit</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Rekomendasi Order</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {recommendation.recommendedOrder} {product.units?.abbreviation}
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Berdasarkan analisis penjualan dan tanggal kadaluarsa
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pembelian & Tanggal Kadaluarsa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Tanggal Beli</th>
                      <th className="text-left p-2">Supplier</th>
                      <th className="text-left p-2">Quantity</th>
                      <th className="text-left p-2">Tanggal Kadaluarsa</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.slice(0, 10).map((item) => {
                      const expiryDate = item.expiration_date ? new Date(item.expiration_date) : null;
                      const isExpired = expiryDate && expiryDate < new Date();
                      const isNearExpiry = expiryDate && !isExpired && 
                        (expiryDate.getTime() - new Date().getTime()) < (7 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            {new Date(item.purchases.purchase_date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="p-2">{item.purchases.suppliers?.name || '-'}</td>
                          <td className="p-2">{item.quantity} {product.units?.abbreviation}</td>
                          <td className="p-2">
                            {expiryDate ? expiryDate.toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="p-2">
                            {!expiryDate ? (
                              <span className="text-gray-500">-</span>
                            ) : isExpired ? (
                              <span className="text-red-600 font-medium">Kadaluarsa</span>
                            ) : isNearExpiry ? (
                              <span className="text-orange-600 font-medium">Mendekati Kadaluarsa</span>
                            ) : (
                              <span className="text-green-600 font-medium">Baik</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockLevelDetailsModal;
