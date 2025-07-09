
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award } from 'lucide-react';

const CustomerRanking = () => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customer-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-medium">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">TOP 1</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">TOP 2</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600">TOP 3</Badge>;
    return null;
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total Belanja</TableHead>
              <TableHead>Total Poin</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded"></div></TableCell>
                </TableRow>
              ))
            ) : customers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Belum ada data customer
                </TableCell>
              </TableRow>
            ) : (
              customers?.map((customer, index) => (
                <TableRow key={customer.id}>
                  <TableCell className="flex items-center gap-2">
                    {getRankIcon(index + 1)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.customer_code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    Rp {customer.total_spent.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-blue-600">{customer.total_points}</span>
                  </TableCell>
                  <TableCell>
                    {getRankBadge(index + 1)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CustomerRanking;
