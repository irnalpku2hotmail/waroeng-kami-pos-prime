import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface SupplierReturnsTabProps {
  returns: any[];
}

const SupplierReturnsTab = ({ returns }: SupplierReturnsTabProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      process: { label: 'Proses', variant: 'secondary' },
      success: { label: 'Berhasil', variant: 'default' },
      rejected: { label: 'Ditolak', variant: 'destructive' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (returns.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Tidak ada data retur supplier
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Retur</TableHead>
              <TableHead>Tanggal Retur</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((returnItem) => (
              <TableRow key={returnItem.id}>
                <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                <TableCell>{format(new Date(returnItem.return_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{returnItem.suppliers?.name || '-'}</TableCell>
                <TableCell>{returnItem.reason || '-'}</TableCell>
                <TableCell>Rp {returnItem.total_amount?.toLocaleString('id-ID') || 0}</TableCell>
                <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SupplierReturnsTab;
