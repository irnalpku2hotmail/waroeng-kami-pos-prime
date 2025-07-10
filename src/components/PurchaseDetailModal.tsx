
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign } from 'lucide-react';
import PurchasePaymentForm from './purchase/PurchasePaymentForm';
import { useState } from 'react';

interface PurchaseDetailModalProps {
  purchase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PurchaseDetailModal = ({ purchase, open, onOpenChange }: PurchaseDetailModalProps) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Fetch detailed purchase data with items
  const { data: detailedPurchase, isLoading } = useQuery({
    queryKey: ['purchase-detail', purchase?.id],
    queryFn: async () => {
      if (!purchase?.id) return null;
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          purchase_items(
            *,
            products(name, unit_id),
            units:purchase_unit_id(name, abbreviation)
          ),
          purchase_payments(
            id,
            payment_amount,
            payment_date,
            notes
          )
        `)
        .eq('id', purchase.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!purchase?.id && open
  });

  if (!purchase || isLoading) return null;

  const currentPurchase = detailedPurchase || purchase;

  const getPaymentStatus = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return <Badge className="bg-green-600">Lunas</Badge>;
    } else if (purchase.payment_method === 'credit') {
      const totalPaid = purchase.purchase_payments?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
      const remaining = purchase.total_amount - totalPaid;
      
      if (remaining <= 0) {
        return <Badge className="bg-green-600">Lunas</Badge>;
      } else if (totalPaid > 0) {
        return <Badge className="bg-yellow-600">Sebagian</Badge>;
      } else {
        return <Badge className="bg-red-600">Belum Bayar</Badge>;
      }
    }
    return <Badge className="bg-gray-600">Unknown</Badge>;
  };

  const getTotalPaid = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return purchase.total_amount;
    }
    return purchase.purchase_payments?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
  };

  const getRemainingAmount = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return 0;
    }
    const totalPaid = getTotalPaid(purchase);
    return Math.max(0, purchase.total_amount - totalPaid);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Detail Pembelian - {currentPurchase.purchase_number}</DialogTitle>
              {currentPurchase.payment_method === 'credit' && getRemainingAmount(currentPurchase) > 0 && (
                <Button
                  onClick={() => setPaymentModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Bayar Kredit
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Purchase Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-500">No. Pembelian</label>
                <p className="text-sm font-semibold">{currentPurchase.purchase_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">No. Invoice</label>
                <p className="text-sm">{currentPurchase.invoice_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier</label>
                <p className="text-sm">{currentPurchase.suppliers?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status Pembayaran</label>
                <div className="mt-1">{getPaymentStatus(currentPurchase)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tanggal Pembelian</label>
                <p className="text-sm">{new Date(currentPurchase.purchase_date).toLocaleDateString('id-ID')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Jatuh Tempo</label>
                <p className="text-sm">
                  {currentPurchase.due_date ? new Date(currentPurchase.due_date).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total</label>
                <p className="text-sm font-semibold">Rp {currentPurchase.total_amount?.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Dibuat oleh</label>
                <p className="text-sm">{currentPurchase.profiles?.full_name || 'Unknown'}</p>
              </div>
              {currentPurchase.payment_method === 'credit' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Dibayar</label>
                    <p className="text-sm font-semibold text-green-600">
                      Rp {getTotalPaid(currentPurchase).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sisa Kredit</label>
                    <p className="text-sm font-semibold text-red-600">
                      Rp {getRemainingAmount(currentPurchase).toLocaleString('id-ID')}
                    </p>
                  </div>
                </>
              )}
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
                      <TableHead>Unit</TableHead>
                      <TableHead>Konversi</TableHead>
                      <TableHead>Harga Satuan</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Exp. Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPurchase.purchase_items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.products?.name || 'Product not found'}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.units?.name ? `${item.units.name} (${item.units.abbreviation})` : '-'}
                        </TableCell>
                        <TableCell>
                          x{Number(item.conversion_factor || 1).toLocaleString('id-ID', { maximumFractionDigits: 6 })}
                        </TableCell>
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

            {/* Payment History for Credit Purchases */}
            {currentPurchase.payment_method === 'credit' && currentPurchase.purchase_payments?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Riwayat Pembayaran</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPurchase.purchase_payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(payment.payment_date).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            Rp {payment.payment_amount?.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>{payment.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Notes */}
            {currentPurchase.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Catatan</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{currentPurchase.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PurchasePaymentForm
        purchase={currentPurchase}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
      />
    </>
  );
};

export default PurchaseDetailModal;
