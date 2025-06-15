
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerReports = () => {
  // Fetch data dari orders dan transactions
  const { data: customerRanking, isLoading } = useQuery({
    queryKey: ['customer-ranking-combined'],
    queryFn: async () => {
      // 1. Ambil order COD/Delivery
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, customer_name, total_amount')
        .not('customer_name', 'is', null);

      if (ordersError) throw ordersError;

      // 2. Ambil transaksi POS (transactions, customer_id bisa null)
      const { data: transactions, error: trxError } = await supabase
        .from('transactions')
        .select('customer_id, total_amount')
        .not('customer_id', 'is', null);

      if (trxError) throw trxError;

      // Map customer ID ke nama (dari tabel customers)
      // Dapatkan daftar customer_id unik
      const customerIdSet = new Set<string>();
      (orders || []).forEach(o => { if (o.customer_id) customerIdSet.add(o.customer_id); });
      (transactions || []).forEach(t => { if (t.customer_id) customerIdSet.add(t.customer_id); });
      const customerIdArr = Array.from(customerIdSet);

      // Untuk menampilkan nama customer dari tabel customers (by id, fallback ke nama di orders)
      let customersMap: Record<string, { id: string; name: string | null }> = {};
      if (customerIdArr.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIdArr);

        if (customersData) {
          for (const c of customersData) {
            customersMap[c.id] = { id: c.id, name: c.name };
          }
        }
      }

      // Gabungkan data
      const customerSpending: Record<string, { id: string | null, name: string, total: number, orders: number }> = {};

      // Dari orders (mungkin customer_id bisa null, nama diambil dari customer_name)
      for (const order of orders || []) {
        let key = order.customer_id || order.customer_name;
        let name = customersMap[order.customer_id]?.name ?? order.customer_name ?? "Tanpa Nama";
        if (!customerSpending[key]) {
          customerSpending[key] = { id: order.customer_id ?? null, name, total: 0, orders: 0 };
        }
        customerSpending[key].total += order.total_amount || 0;
        customerSpending[key].orders += 1;
      }

      // Dari transaksi POS (by customer_id, nama dari tabel customers jika ada)
      for (const trx of transactions || []) {
        // kemungkinan customer sudah ada di map, jika belum ambil dari tabel customer
        const key = trx.customer_id;
        let name = customersMap[trx.customer_id]?.name ?? "Tanpa Nama";
        if (!customerSpending[key]) {
          customerSpending[key] = { id: trx.customer_id ?? null, name, total: 0, orders: 0 };
        }
        customerSpending[key].total += trx.total_amount || 0;
        customerSpending[key].orders += 1;
      }

      // Konversi ke array, urutkan, ambil top 20
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
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                customerRanking?.map((customer, index) => (
                  <TableRow key={customer.id ?? customer.name}>
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
