import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

    const receiptSettings = settings?.receipt_settings || {};
    const storeName = settings?.store_name?.name || 'Toko Saya';
    const storeAddress = settings?.store_address?.address || '';
    const storePhone = settings?.store_phone?.phone || '';
    const paperSize = receiptSettings.paper_size || '80mm';
    const width = paperSize === '58mm' ? '58mm' : '80mm';

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Faktur Piutang - ${transaction.transaction_number}</title>
          <style>
            @media print {
              @page {
                size: ${width} auto;
                margin: 5mm;
              }
              body { margin: 0; padding: 0; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 10px;
              max-width: ${width};
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .store-name { font-weight: bold; font-size: 14px; }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .items-table {
              width: 100%;
              margin: 10px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 5px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .total-section {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #000;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${storeName}</div>
            ${storeAddress ? `<div>${storeAddress}</div>` : ''}
            ${storePhone ? `<div>Telp: ${storePhone}</div>` : ''}
          </div>

          ${receiptSettings.header_text ? `
            <div style="text-align: center; margin-bottom: 10px; font-style: italic;">
              ${receiptSettings.header_text}
            </div>
          ` : ''}

          <div style="text-align: center; font-weight: bold; margin: 10px 0;">
            FAKTUR PIUTANG
          </div>

          <div class="info-row">
            <span>No. Transaksi</span>
            <span>${transaction.transaction_number}</span>
          </div>
          <div class="info-row">
            <span>Tanggal</span>
            <span>${new Date(transaction.created_at).toLocaleDateString('id-ID')}</span>
          </div>
          <div class="info-row">
            <span>Jatuh Tempo</span>
            <span>${transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('id-ID') : '-'}</span>
          </div>
          <div class="info-row">
            <span>Pelanggan</span>
            <span>${transaction.customers?.name || 'Umum'}</span>
          </div>
          ${receiptSettings.show_cashier ? `
            <div class="info-row">
              <span>Kasir</span>
              <span>${transaction.profiles?.full_name || '-'}</span>
            </div>
          ` : ''}

          <div class="items-table">
            ${transactionItems.map((item: any) => `
              <div class="item-row">
                <div style="flex: 1;">${item.products?.name || '-'}</div>
              </div>
              <div class="item-row" style="font-size: 11px;">
                <span>${item.quantity} x Rp ${item.unit_price.toLocaleString('id-ID')}</span>
                <span>Rp ${item.total_price.toLocaleString('id-ID')}</span>
              </div>
            `).join('')}
          </div>

          <div class="total-section">
            <div class="info-row" style="font-weight: bold;">
              <span>TOTAL</span>
              <span>Rp ${transaction.total_amount.toLocaleString('id-ID')}</span>
            </div>
            <div class="info-row">
              <span>Dibayar</span>
              <span>Rp ${transaction.paid_amount.toLocaleString('id-ID')}</span>
            </div>
            <div class="info-row" style="font-weight: bold; color: red;">
              <span>SISA PIUTANG</span>
              <span>Rp ${(transaction.total_amount - transaction.paid_amount).toLocaleString('id-ID')}</span>
            </div>
          </div>

          ${receiptSettings.footer_text ? `
            <div class="footer">
              ${receiptSettings.footer_text}
            </div>
          ` : ''}

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
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
