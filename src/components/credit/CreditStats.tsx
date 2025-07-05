import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface CreditStatsProps {
  transactions: any[];
}

const CreditStats = ({ transactions }: CreditStatsProps) => {
  const totalCredit = transactions.reduce((sum, t) => sum + (t.total_amount - t.paid_amount), 0);
  const activeCredits = transactions.filter(t => t.total_amount > t.paid_amount).length;
  const overdueCredits = transactions.filter(t => {
    const isActive = t.total_amount > t.paid_amount;
    const isOverdue = new Date(t.due_date) < new Date();
    return isActive && isOverdue;
  }).length;
  const paidCredits = transactions.filter(t => t.total_amount <= t.paid_amount).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rp {totalCredit.toLocaleString('id-ID')}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Credits</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCredits}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueCredits}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Credits</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{paidCredits}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditStats;
