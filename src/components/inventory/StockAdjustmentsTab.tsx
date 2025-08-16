
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StockAdjustment {
  id: string;
  created_at: string;
  adjustment_type: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  products?: { name: string };
  profiles?: { full_name: string };
}

interface StockAdjustmentsTabProps {
  adjustments: StockAdjustment[];
}

const StockAdjustmentsTab = ({ adjustments }: StockAdjustmentsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penyesuaian Stok</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Perubahan</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Alasan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{adjustment.products?.name}</TableCell>
                <TableCell>
                  <Badge variant={
                    adjustment.adjustment_type === 'increase' ? 'default' :
                    adjustment.adjustment_type === 'decrease' ? 'destructive' : 'secondary'
                  }>
                    {adjustment.adjustment_type === 'increase' ? 'Tambah' : 
                     adjustment.adjustment_type === 'decrease' ? 'Kurangi' : 'Koreksi'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {adjustment.adjustment_type === 'correction' ? (
                    `${adjustment.previous_stock} → ${adjustment.new_stock}`
                  ) : (
                    `${adjustment.adjustment_type === 'increase' ? '+' : '-'}${adjustment.quantity_change}`
                  )}
                </TableCell>
                <TableCell>{adjustment.profiles?.full_name}</TableCell>
                <TableCell>{adjustment.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StockAdjustmentsTab;
