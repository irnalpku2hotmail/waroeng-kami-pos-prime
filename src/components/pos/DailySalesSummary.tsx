import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Receipt, DollarSign, Package, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DailySalesSummary = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['daily-sales-summary', today.toISOString()],
    queryFn: async () => {
      // Get today's transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, total_amount, created_at')
        .gte('created_at', today.toISOString());

      if (txError) throw txError;

      // Get transaction items for today's transactions
      const transactionIds = transactions?.map(t => t.id) || [];
      let totalItems = 0;

      if (transactionIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('transaction_items')
          .select('quantity')
          .in('transaction_id', transactionIds);

        if (itemsError) throw itemsError;
        totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      }

      const totalTransactions = transactions?.length || 0;
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      return {
        totalTransactions,
        totalRevenue,
        totalItems,
        averageTransaction,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Transaksi',
      value: summary?.totalTransactions || 0,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'from-blue-500/10 to-blue-600/20',
    },
    {
      label: 'Total Penjualan',
      value: `Rp ${(summary?.totalRevenue || 0).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'from-green-500/10 to-green-600/20',
    },
    {
      label: 'Item Terjual',
      value: summary?.totalItems || 0,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'from-purple-500/10 to-purple-600/20',
    },
    {
      label: 'Rata-rata',
      value: `Rp ${Math.round(summary?.averageTransaction || 0).toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'from-orange-500/10 to-orange-600/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`bg-gradient-to-br ${stat.bgColor} border-0 shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color} mt-1`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DailySalesSummary;
