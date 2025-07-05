
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CreditCard, MessageSquare, Eye } from 'lucide-react';

interface CreditTableProps {
  creditTransactions: any[];
  isLoading: boolean;
  onPayCredit: (transaction: any) => void;
  onSendReminder: (transaction: any) => void;
}

const CreditTable = ({ creditTransactions, isLoading, onPayCredit, onSendReminder }: CreditTableProps) => {
  const getStatusBadge = (transaction: any) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = transaction.due_date;
    const remainingAmount = transaction.total_amount - transaction.paid_amount;
    
    if (remainingAmount <= 0) {
      return <Badge className="bg-green-600">Lunas</Badge>;
    } else if (dueDate && dueDate < today) {
      return <Badge className="bg-red-600">Overdue</Badge>;
    } else if (dueDate === today) {
      return <Badge className="bg-orange-600">Jatuh Tempo Hari Ini</Badge>;
    } else {
      return <Badge className="bg-blue-600">Aktif</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!creditTransactions || creditTransactions.length === 0) {
    return <div className="text-center py-8">Tidak ada data piutang</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Transaksi</TableHead>
          <TableHead>Pelanggan</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Terbayar</TableHead>
          <TableHead>Sisa</TableHead>
          <TableHead>Jatuh Tempo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Kasir</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {creditTransactions.map((transaction) => {
          const remainingAmount = transaction.total_amount - transaction.paid_amount;
          return (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.transaction_number}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{transaction.customers?.name || 'Guest'}</div>
                  {transaction.customers?.phone && (
                    <div className="text-sm text-gray-500">{transaction.customers.phone}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>Rp {transaction.total_amount?.toLocaleString('id-ID')}</TableCell>
              <TableCell>Rp {transaction.paid_amount?.toLocaleString('id-ID')}</TableCell>
              <TableCell>
                <span className={remainingAmount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  Rp {remainingAmount?.toLocaleString('id-ID')}
                </span>
              </TableCell>
              <TableCell>
                {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('id-ID') : '-'}
              </TableCell>
              <TableCell>{getStatusBadge(transaction)}</TableCell>
              <TableCell>{transaction.profiles?.full_name || 'Unknown'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onPayCredit(transaction)}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Catat Pembayaran
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSendReminder(transaction)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Kirim Pengingat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default CreditTable;
