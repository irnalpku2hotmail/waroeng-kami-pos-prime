import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, DollarSign, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DailySalesSummary = () => {
  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['pos-daily-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, total_amount, payment_type')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      if (error) throw error;

      const totalTransactions = transactions?.length || 0;
      const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const cashSales = transactions?.filter(t => t.payment_type === 'cash').reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const creditSales = transactions?.filter(t => t.payment_type === 'credit').reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return {
        totalTransactions,
        totalSales,
        cashSales,
        creditSales,
        avgTransaction,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Transaksi',
      value: todayStats?.totalTransactions || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Penjualan',
      value: `Rp ${(todayStats?.totalSales || 0).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Cash',
      value: `Rp ${(todayStats?.cashSales || 0).toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Rata-rata',
      value: `Rp ${Math.round(todayStats?.avgTransaction || 0).toLocaleString('id-ID')}`,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((stat) => (
        <Card key={stat.label} className="overflow-hidden">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className={`text-xs sm:text-sm font-bold ${stat.color} truncate`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DailySalesSummary;
