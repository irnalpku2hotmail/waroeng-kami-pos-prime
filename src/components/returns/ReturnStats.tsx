
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Clock, CheckCircle, TrendingDown } from 'lucide-react';

const ReturnStats = () => {
  const { data: returnStats } = useQuery({
    queryKey: ['return-stats'],
    queryFn: async () => {
      // Returns in process
      const { data: processReturns } = await supabase
        .from('returns')
        .select('total_amount')
        .eq('status', 'process');

      // Successful returns
      const { data: successReturns } = await supabase
        .from('returns')
        .select('total_amount')
        .eq('status', 'success');

      // All returns
      const { data: allReturns } = await supabase
        .from('returns')
        .select('total_amount');

      const processAmount = processReturns?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
      const successAmount = successReturns?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
      const totalAmount = allReturns?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

      return {
        processAmount,
        successAmount,
        totalAmount,
        processCount: processReturns?.length || 0,
        successCount: successReturns?.length || 0,
        totalCount: allReturns?.length || 0
      };
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Return</CardTitle>
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            Rp {returnStats?.totalAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {returnStats?.totalCount || 0} return
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            Rp {returnStats?.processAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {returnStats?.processCount || 0} return
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Berhasil</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Rp {returnStats?.successAmount?.toLocaleString('id-ID') || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {returnStats?.successCount || 0} return
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tingkat Keberhasilan</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">
            {returnStats && returnStats.totalCount > 0 
              ? Math.round((returnStats.successCount / returnStats.totalCount) * 100)
              : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            return berhasil
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnStats;
