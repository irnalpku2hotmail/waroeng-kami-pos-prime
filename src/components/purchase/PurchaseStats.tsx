
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CreditCard, Banknote, TrendingUp } from 'lucide-react';

const PurchaseStats = () => {
  const { data: purchaseStats } = useQuery({
    queryKey: ['purchase-stats'],
    queryFn: async () => {
      // Total purchases
      const { data: totalPurchases } = await supabase
        .from('purchases')
        .select('total_amount');

      // Credit purchases
      const { data: creditPurchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('payment_method', 'credit');

      // Cash purchases
      const { data: cashPurchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('payment_method', 'cash');

      const totalAmount = totalPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const creditAmount = creditPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const cashAmount = cashPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

      return {
        totalAmount,
        creditAmount,
        cashAmount,
        totalCount: totalPurchases?.length || 0,
        creditCount: creditPurchases?.length || 0,
        cashCount: cashPurchases?.length || 0
      };
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            Rp {purchaseStats?.totalAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {purchaseStats?.totalCount || 0} transaksi
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pembelian Kredit</CardTitle>
          <CreditCard className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            Rp {purchaseStats?.creditAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {purchaseStats?.creditCount || 0} transaksi
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pembelian Cash</CardTitle>
          <Banknote className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Rp {purchaseStats?.cashAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {purchaseStats?.cashCount || 0} transaksi
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rata-rata Pembelian</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">
            Rp {purchaseStats && purchaseStats.totalCount > 0 
              ? Math.round(purchaseStats.totalAmount / purchaseStats.totalCount).toLocaleString('id-ID')
              : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            per transaksi
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseStats;
