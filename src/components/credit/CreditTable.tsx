import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Phone, Mail, MessageSquare } from 'lucide-react';

interface CreditTableProps {
  transactions: any[];
  isLoading?: boolean;
  onPayCredit?: (transaction: any) => void;
  onSendReminder?: (transaction: any) => void;
}

const CreditTable = ({ transactions, isLoading = false, onPayCredit, onSendReminder }: CreditTableProps) => {
  const getPaymentStatus = (transaction: any) => {
    const today = new Date();
    const dueDate = new Date(transaction.due_date);
    
    if (dueDate < today) {
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'overdue',
        label: `Overdue ${daysOverdue} hari`,
        variant: 'destructive' as const
      };
    } else if (dueDate.toDateString() === today.toDateString()) {
      return {
        status: 'due_today',
        label: 'Jatuh tempo hari ini',
        variant: 'secondary' as const
      };
    } else {
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'pending',
        label: `${daysUntilDue} hari lagi`,
        variant: 'default' as const
      };
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (transactions?.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Belum ada transaksi kredit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Transaksi</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((transaction) => {
            const paymentStatus = getPaymentStatus(transaction);
            
            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.transaction_number}
                </TableCell>
                <TableCell>{transaction.customers?.name || 'Customer Umum'}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {transaction.customers?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {transaction.customers.phone}
                      </div>
                    )}
                    {transaction.customers?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {transaction.customers.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    Rp {transaction.total_amount?.toLocaleString('id-ID')}
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('id-ID') : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={paymentStatus.variant}>
                    {paymentStatus.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {onPayCredit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPayCredit(transaction)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Bayar
                      </Button>
                    )}
                    {onSendReminder && transaction.customers && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendReminder(transaction)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Ingatkan
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CreditTable;
