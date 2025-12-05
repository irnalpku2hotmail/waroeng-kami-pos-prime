
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertTriangle, Wallet, CheckCircle } from 'lucide-react';

const EnhancedCreditStats = () => {
  const { data: creditStats } = useQuery({
    queryKey: ['enhanced-credit-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all credit transactions
      const { data: creditTransactions } = await supabase
        .from('transactions')
        .select('id, total_amount, due_date')
        .eq('is_credit', true);

      // Get all credit payments
      const { data: creditPayments } = await supabase
        .from('credit_payments')
        .select('transaction_id, payment_amount');

      // Calculate total paid per transaction
      const paidByTransaction: Record<string, number> = {};
      creditPayments?.forEach(payment => {
        if (!paidByTransaction[payment.transaction_id]) {
          paidByTransaction[payment.transaction_id] = 0;
        }
        paidByTransaction[payment.transaction_id] += payment.payment_amount;
      });

      // Calculate remaining balance per transaction
      let totalOutstanding = 0;
      let totalPaid = 0;
      let overdueAmount = 0;
      let dueTodayAmount = 0;
      let overdueCount = 0;
      let dueTodayCount = 0;
      let activeCredits = 0;

      creditTransactions?.forEach(tx => {
        const paid = paidByTransaction[tx.id] || 0;
        const remaining = tx.total_amount - paid;
        
        totalPaid += paid;
        
        if (remaining > 0) {
          totalOutstanding += remaining;
          activeCredits++;
          
          const dueDate = tx.due_date;
          if (dueDate) {
            if (dueDate < today) {
              overdueAmount += remaining;
              overdueCount++;
            } else if (dueDate === today) {
              dueTodayAmount += remaining;
              dueTodayCount++;
            }
          }
        }
      });

      return {
        totalOutstanding,
        totalPaid,
        overdueAmount,
        dueTodayAmount,
        totalCount: creditTransactions?.length || 0,
        activeCount: activeCredits,
        overdueCount,
        dueTodayCount
      };
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sisa Piutang</CardTitle>
          <Wallet className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            Rp {creditStats?.totalOutstanding?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {creditStats?.activeCount || 0} transaksi aktif
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sudah Dibayar</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Rp {creditStats?.totalPaid?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            dari {creditStats?.totalCount || 0} total transaksi
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            Rp {creditStats?.overdueAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {creditStats?.overdueCount || 0} transaksi overdue
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jatuh Tempo Hari Ini</CardTitle>
          <CreditCard className="h-4 w-4 text-yellow-500" />
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

export default EnhancedCreditStats;
