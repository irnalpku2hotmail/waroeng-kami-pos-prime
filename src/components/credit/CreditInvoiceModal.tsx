import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateReceiptHTML } from '@/utils/receiptGenerator';
import { extractReceiptSettings } from '@/utils/receiptSettingsHelper';

interface CreditInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
}

const CreditInvoiceModal = ({ open, onOpenChange, transaction }: CreditInvoiceModalProps) => {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  const { data: transactionItems = [] } = useQuery({
    queryKey: ['transaction-items', transaction?.id],
    queryFn: async () => {
      if (!transaction?.id) return [];
      const { data, error } = await supabase
        .from('transaction_items')
        .select('*, products(name)')
        .eq('transaction_id', transaction.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!transaction?.id && open
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'Gagal membuka jendela print', variant: 'destructive' });
      return;
    }

    // Use helper to extract receipt settings consistently
    const receiptSettings = extractReceiptSettings(settings);

    const receiptData = {
      transaction_number: transaction.transaction_number,
      transaction_date: transaction.created_at,
      customer_name: transaction.customers?.name || 'Umum',
      items: (transactionItems || []).map((item: any) => ({
        name: item.products?.name || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      subtotal: transaction.total_amount,
      total: transaction.total_amount,
      paid_amount: transaction.paid_amount,
      change_amount: 0,
      payment_method: 'Kredit',
      notes: `Jatuh Tempo: ${transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('id-ID') : '-'}\nSisa Pembayaran: Rp ${(transaction.total_amount - transaction.paid_amount).toLocaleString('id-ID')}`,
    };

    const receiptHTML = generateReceiptHTML(receiptData, receiptSettings);

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Faktur Piutang</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">No. Transaksi:</span>
              <span className="font-semibold">{transaction.transaction_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pelanggan:</span>
              <span className="font-semibold">{transaction.customers?.name || 'Umum'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-semibold">Rp {transaction.total_amount?.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Dibayar:</span>
              <span className="font-semibold">Rp {transaction.paid_amount?.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-bold text-red-600">Sisa Piutang:</span>
              <span className="font-bold text-red-600">
                Rp {(transaction.total_amount - transaction.paid_amount).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Tutup
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Faktur
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditInvoiceModal;
