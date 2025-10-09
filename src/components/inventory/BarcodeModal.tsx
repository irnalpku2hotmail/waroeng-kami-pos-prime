import { useRef } from 'react';
import Barcode from 'react-barcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface BarcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    name: string;
    barcode: string;
    selling_price: number;
  } | null;
}

const BarcodeModal = ({ open, onOpenChange, product }: BarcodeModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=600,height=400');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${product?.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .barcode-container {
              text-align: center;
            }
            .product-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .product-price {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
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

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode Produk</DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="text-center">
            <div className="text-lg font-bold mb-2">{product.name}</div>
            <div className="text-md text-gray-600 mb-4">
              Rp {product.selling_price.toLocaleString('id-ID')}
            </div>
          </div>
          
          {product.barcode ? (
            <div className="bg-white p-4 rounded border">
              <Barcode 
                value={product.barcode} 
                format="CODE128"
                width={2}
                height={80}
                displayValue={true}
                fontSize={14}
              />
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Produk tidak memiliki barcode
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          {product.barcode && (
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak Barcode
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeModal;
