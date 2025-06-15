
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReturnDetailModalProps {
  returnData: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReturnDetailModal = ({ returnData, open, onOpenChange }: ReturnDetailModalProps) => {
  if (!returnData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Return - {returnData.return_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Return Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-500">No. Return</label>
              <p className="text-sm font-semibold">{returnData.return_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">No. Invoice</label>
              <p className="text-sm">{returnData.invoice_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Supplier</label>
              <p className="text-sm">{returnData.suppliers?.name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className={`px-2 py-1 rounded-full text-xs ${
                returnData.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {returnData.status === 'success' ? 'Success' : 'Process'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tanggal Return</label>
              <p className="text-sm">{new Date(returnData.return_date).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total</label>
              <p className="text-sm font-semibold">Rp {returnData.total_amount?.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Dibuat oleh</label>
              <p className="text-sm">{returnData.profiles?.full_name || 'Unknown'}</p>
            </div>
            {returnData.reason && (
              <div>
                <label className="text-sm font-medium text-gray-500">Alasan</label>
                <p className="text-sm">{returnData.reason}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Item Return</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Harga Satuan</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnData.return_items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.products?.name || 'Product not found'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>Rp {item.unit_cost?.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {item.total_cost?.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnDetailModal;
