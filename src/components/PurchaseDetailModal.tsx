
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PurchaseDetailModalProps {
  purchase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PurchaseDetailModal = ({ purchase, open, onOpenChange }: PurchaseDetailModalProps) => {
  if (!purchase) return null;

  const getPaymentStatus = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return <Badge className="bg-green-600">Paid</Badge>;
    } else if (purchase.payment_method === 'credit') {
      const isOverdue = purchase.due_date && new Date(purchase.due_date) < new Date();
      return (
        <Badge className={isOverdue ? 'bg-red-600' : 'bg-orange-600'}>
          {isOverdue ? 'Overdue' : 'Pending'}
        </Badge>
      );
    }
    return <Badge className="bg-gray-600">Unknown</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pembelian - {purchase.purchase_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Purchase Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-500">No. Pembelian</label>
              <p className="text-sm font-semibold">{purchase.purchase_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">No. Invoice</label>
              <p className="text-sm">{purchase.invoice_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Supplier</label>
              <p className="text-sm">{purchase.suppliers?.name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status Pembayaran</label>
              <div className="mt-1">{getPaymentStatus(purchase)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tanggal Pembelian</label>
              <p className="text-sm">{new Date(purchase.purchase_date).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Jatuh Tempo</label>
              <p className="text-sm">
                {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('id-ID') : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total</label>
              <p className="text-sm font-semibold">Rp {purchase.total_amount?.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Dibuat oleh</label>
              <p className="text-sm">{purchase.profiles?.full_name || 'Unknown'}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Item Pembelian</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Harga Satuan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Exp. Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.purchase_items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.products?.name || 'Product not found'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>Rp {item.unit_cost?.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {item.total_cost?.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString('id-ID') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Catatan</h3>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{purchase.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDetailModal;
