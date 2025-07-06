
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, CreditCard, Calendar, TrendingDown } from 'lucide-react';

const Notifications = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Low stock products - compare current_stock with min_stock
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, current_stock, min_stock')
        .filter('current_stock', 'lte', 'min_stock');

      // Overdue credit transactions
      const { data: overdueCredits } = await supabase
        .from('transactions')
        .select('transaction_number, total_amount, due_date, customers(name)')
        .eq('is_credit', true)
        .lt('due_date', today);

      // Due today credit transactions
      const { data: dueTodayCredits } = await supabase
        .from('transactions')
        .select('transaction_number, total_amount, due_date, customers(name)')
        .eq('is_credit', true)
        .eq('due_date', today);

      // Overdue purchase payments
      const { data: overduePurchases } = await supabase
        .from('purchases')
        .select('purchase_number, total_amount, due_date, suppliers(name)')
        .eq('payment_method', 'credit')
        .lt('due_date', today);

      // Expired products
      const { data: expiredProducts } = await supabase
        .from('purchase_items')
        .select('expiration_date, products(name)')
        .lt('expiration_date', today)
        .not('expiration_date', 'is', null);

      return {
        lowStockProducts: lowStockProducts || [],
        overdueCredits: overdueCredits || [],
        dueTodayCredits: dueTodayCredits || [],
        overduePurchases: overduePurchases || [],
        expiredProducts: expiredProducts || []
      };
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading notifications...</div>
      </Layout>
    );
  }

  const totalNotifications = (notifications?.lowStockProducts?.length || 0) +
    (notifications?.overdueCredits?.length || 0) +
    (notifications?.dueTodayCredits?.length || 0) +
    (notifications?.overduePurchases?.length || 0) +
    (notifications?.expiredProducts?.length || 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Notifikasi & Peringatan</h1>
          <Badge variant={totalNotifications > 0 ? "destructive" : "secondary"}>
            {totalNotifications} Peringatan
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Stok Rendah ({notifications?.lowStockProducts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications?.lowStockProducts?.length === 0 ? (
                <p className="text-gray-500">Tidak ada produk dengan stok rendah</p>
              ) : (
                <div className="space-y-2">
                  {notifications?.lowStockProducts?.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-orange-600">
                        Stok: {product.current_stock} (Min: {product.min_stock})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-500" />
                Piutang Terlambat ({notifications?.overdueCredits?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications?.overdueCredits?.length === 0 ? (
                <p className="text-gray-500">Tidak ada piutang yang terlambat</p>
              ) : (
                <div className="space-y-2">
                  {notifications?.overdueCredits?.map((credit, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <span className="font-medium">{credit.transaction_number}</span>
                        <p className="text-sm text-gray-600">{credit.customers?.name || 'Guest'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-red-600 font-medium">
                          Rp {credit.total_amount?.toLocaleString('id-ID')}
                        </span>
                        <p className="text-sm text-gray-600">Jatuh tempo: {credit.due_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Due Today Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                Jatuh Tempo Hari Ini ({notifications?.dueTodayCredits?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications?.dueTodayCredits?.length === 0 ? (
                <p className="text-gray-500">Tidak ada piutang yang jatuh tempo hari ini</p>
              ) : (
                <div className="space-y-2">
                  {notifications?.dueTodayCredits?.map((credit, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <span className="font-medium">{credit.transaction_number}</span>
                        <p className="text-sm text-gray-600">{credit.customers?.name || 'Guest'}</p>
                      </div>
                      <span className="text-yellow-600 font-medium">
                        Rp {credit.total_amount?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Purchases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Pembelian Kredit Terlambat ({notifications?.overduePurchases?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications?.overduePurchases?.length === 0 ? (
                <p className="text-gray-500">Tidak ada pembelian kredit yang terlambat</p>
              ) : (
                <div className="space-y-2">
                  {notifications?.overduePurchases?.map((purchase, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <span className="font-medium">{purchase.purchase_number}</span>
                        <p className="text-sm text-gray-600">{purchase.suppliers?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-red-600 font-medium">
                          Rp {purchase.total_amount?.toLocaleString('id-ID')}
                        </span>
                        <p className="text-sm text-gray-600">Jatuh tempo: {purchase.due_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expired Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Produk Kedaluwarsa ({notifications?.expiredProducts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications?.expiredProducts?.length === 0 ? (
                <p className="text-gray-500">Tidak ada produk yang kedaluwarsa</p>
              ) : (
                <div className="space-y-2">
                  {notifications?.expiredProducts?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium">{item.products?.name}</span>
                      <span className="text-red-600">
                        Kedaluwarsa: {item.expiration_date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
