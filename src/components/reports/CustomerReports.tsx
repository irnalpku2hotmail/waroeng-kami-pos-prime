
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerReports = () => {
  // Top customers by spending
  const { data: topCustomers, isLoading: isLoadingTopCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name, total_amount, customer_id')
        .not('customer_name', 'is', null);

      if (error) throw error;

      const customerSpending = data.reduce((acc, order) => {
        const name = order.customer_name;
        if (!acc[name]) {
          acc[name] = { name, total: 0, orders: 0 };
        }
        acc[name].total += order.total_amount || 0;
        acc[name].orders += 1;
        return acc;
      }, {} as Record<string, { name: string; total: number; orders: number }>);

      return Object.values(customerSpending)
        .sort((a, b) => b.total - a.total)
        .slice(0, 20);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pelanggan Teratas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peringkat</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead className="text-right">Total Pesanan</TableHead>
                <TableHead className="text-right">Total Belanja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTopCustomers ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                topCustomers?.map((customer, index) => (
                  <TableRow key={customer.name}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right">{customer.orders}</TableCell>
                    <TableCell className="text-right">Rp {customer.total.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerReports;
