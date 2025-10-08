import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface InvoicePrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
}

const InvoicePrintModal = ({ open, onOpenChange, transaction }: InvoicePrintModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${transaction?.transaction_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .invoice-details {
              margin-bottom: 20px;
            }
            .invoice-details table {
              width: 100%;
            }
            .invoice-details td {
              padding: 5px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .items-table th {
              background-color: #f2f2f2;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
            }
            .total-section table {
              margin-left: auto;
              width: 300px;
            }
            .total-section td {
              padding: 5px;
            }
            .total-row {
              font-weight: bold;
              font-size: 1.2em;
              border-top: 2px solid #333;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cetak Faktur</DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="p-6 bg-white">
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="text-3xl font-bold mb-2">FAKTUR PENJUALAN</h1>
            <p className="text-lg">No. {transaction.transaction_number}</p>
          </div>

          <div className="mb-6">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1"><strong>Tanggal:</strong></td>
                  <td className="py-1">{format(new Date(transaction.created_at), 'dd MMMM yyyy', { locale: idLocale })}</td>
                </tr>
                <tr>
                  <td className="py-1"><strong>Pelanggan:</strong></td>
                  <td className="py-1">{transaction.customers?.name || 'Customer Umum'}</td>
                </tr>
                {transaction.customers?.phone && (
                  <tr>
                    <td className="py-1"><strong>Telepon:</strong></td>
                    <td className="py-1">{transaction.customers.phone}</td>
                  </tr>
                )}
                {transaction.customers?.address && (
                  <tr>
                    <td className="py-1"><strong>Alamat:</strong></td>
                    <td className="py-1">{transaction.customers.address}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1"><strong>Metode Pembayaran:</strong></td>
                  <td className="py-1">
                    {transaction.payment_type === 'cash' ? 'Tunai' : 
                     transaction.payment_type === 'debit' ? 'Kartu Debit' : 
                     transaction.payment_type === 'credit' ? 'Kartu Kredit' : 'Transfer'}
                  </td>
                </tr>
                {transaction.due_date && (
                  <tr>
                    <td className="py-1"><strong>Jatuh Tempo:</strong></td>
                    <td className="py-1 text-red-600">{format(new Date(transaction.due_date), 'dd MMMM yyyy', { locale: idLocale })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <table className="w-full border-collapse my-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Item</th>
                <th className="border border-gray-300 p-2 text-right">Harga</th>
                <th className="border border-gray-300 p-2 text-right">Qty</th>
                <th className="border border-gray-300 p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.transaction_items?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{item.products?.name || '-'}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {item.unit_price?.toLocaleString('id-ID')}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">{item.quantity}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    Rp {item.total_price?.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 text-right">
            <table className="ml-auto w-80">
              <tbody>
                <tr>
                  <td className="py-1"><strong>Subtotal:</strong></td>
                  <td className="py-1 text-right">Rp {transaction.total_amount?.toLocaleString('id-ID')}</td>
                </tr>
                {transaction.discount_amount > 0 && (
                  <tr>
                    <td className="py-1"><strong>Diskon:</strong></td>
                    <td className="py-1 text-right text-red-600">
                      -Rp {transaction.discount_amount?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
                {transaction.points_used > 0 && (
                  <tr>
                    <td className="py-1"><strong>Poin Digunakan:</strong></td>
                    <td className="py-1 text-right text-blue-600">{transaction.points_used} poin</td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-800">
                  <td className="py-2"><strong className="text-lg">Total:</strong></td>
                  <td className="py-2 text-right"><strong className="text-lg">Rp {transaction.total_amount?.toLocaleString('id-ID')}</strong></td>
                </tr>
                {transaction.is_credit && (
                  <>
                    <tr>
                      <td className="py-1"><strong>Dibayar:</strong></td>
                      <td className="py-1 text-right">Rp {transaction.paid_amount?.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td className="py-1"><strong>Sisa:</strong></td>
                      <td className="py-1 text-right text-red-600">
                        Rp {(transaction.total_amount - transaction.paid_amount)?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center text-sm text-gray-600">
            <p>Terima kasih atas kepercayaan Anda</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak Faktur
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePrintModal;
