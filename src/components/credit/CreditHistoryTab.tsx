
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, Clock } from 'lucide-react';

const CreditHistoryTab = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all credit payments with transaction details
  const { data: creditHistory = [], isLoading } = useQuery({
    queryKey: ['credit-history', searchTerm],
    queryFn: async () => {
      // Get all credit payments
      const { data: payments, error: paymentsError } = await supabase
        .from('credit_payments')
        .select(`
          *,
          transactions(
            id,
            transaction_number,
            total_amount,
            due_date,
            customers(name, phone)
          ),
          profiles(full_name)
        `)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Get all credit transactions to calculate remaining balance
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          total_amount,
          paid_amount,
          due_date,
          customers(name, phone)
        `)
        .eq('is_credit', true);

      if (transactionsError) throw transactionsError;

      // Calculate total paid per transaction
      const paymentsByTransaction: Record<string, number> = {};
      payments?.forEach(payment => {
        const txId = payment.transaction_id;
        if (!paymentsByTransaction[txId]) {
          paymentsByTransaction[txId] = 0;
        }
        paymentsByTransaction[txId] += payment.payment_amount;
      });

      // Enrich payments with status info
      const enrichedPayments = payments?.map(payment => {
        const totalPaid = paymentsByTransaction[payment.transaction_id] || 0;
        const totalAmount = payment.transactions?.total_amount || 0;
        const isFullyPaid = totalPaid >= totalAmount;
        const remainingAmount = totalAmount - totalPaid;

        return {
          ...payment,
          totalPaid,
          remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
          isFullyPaid,
          status: isFullyPaid ? 'lunas' : 'sebagian'
        };
      });

      // Filter by search term
      if (searchTerm) {
        return enrichedPayments?.filter(payment =>
          payment.transactions?.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.transactions?.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return enrichedPayments;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        Loading riwayat pembayaran...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Cari berdasarkan no. transaksi atau nama pelanggan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* History Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal Bayar</TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Total Piutang</TableHead>
              <TableHead>Jumlah Bayar</TableHead>
              <TableHead>Sisa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Diproses Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creditHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Belum ada riwayat pembayaran piutang
                </TableCell>
              </TableRow>
            ) : (
              creditHistory.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {payment.transactions?.transaction_number || '-'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.transactions?.customers?.name || 'Umum'}</p>
                      {payment.transactions?.customers?.phone && (
                        <p className="text-xs text-gray-500">{payment.transactions.customers.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(payment.transactions?.total_amount || 0)}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(payment.payment_amount)}
                  </TableCell>
                  <TableCell className={payment.remainingAmount > 0 ? 'text-orange-600' : 'text-gray-500'}>
                    {formatCurrency(payment.remainingAmount)}
                  </TableCell>
                  <TableCell>
                    {payment.isFullyPaid ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Lunas
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Sebagian
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {payment.profiles?.full_name || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CreditHistoryTab;
