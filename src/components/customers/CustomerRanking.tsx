
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

const CustomerRanking = () => {
  const { data: topCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{index + 1}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranking Customer Teratas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topCustomers?.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getRankIcon(index)}
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.customer_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{customer.total_points} pts</p>
                <p className="text-sm text-muted-foreground">
                  Rp {customer.total_spent.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerRanking;
