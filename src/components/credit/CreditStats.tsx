
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertTriangle } from 'lucide-react';

const CreditStats = () => {
  const { data: creditStats } = useQuery({
    queryKey: ['credit-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Total credit amount
      const { data: totalCredit } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('is_credit', true);

      // Overdue credits
      const { data: overdueCredits } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('is_credit', true)
        .lt('due_date', today);

      // Due today
      const { data: dueToday } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('is_credit', true)
        .eq('due_date', today);

      const totalAmount = totalCredit?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const overdueAmount = overdueCredits?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const dueTodayAmount = dueToday?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

      return {
        totalAmount,
        overdueAmount,
        dueTodayAmount,
        totalCount: totalCredit?.length || 0,
        overdueCount: overdueCredits?.length || 0,
        dueTodayCount: dueToday?.length || 0
      };
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            Rp {creditStats?.totalAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {creditStats?.totalCount || 0} transaksi
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            Rp {creditStats?.overdueAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {creditStats?.overdueCount || 0} transaksi
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jatuh Tempo Hari Ini</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            Rp {creditStats?.dueTodayAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {creditStats?.dueTodayCount || 0} transaksi
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditStats;
