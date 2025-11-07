import { useRef } from 'react';
import Barcode from 'react-barcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface ProductBarcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const ProductBarcodeModal = ({ open, onOpenChange, product }: ProductBarcodeModalProps) => {
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const barcodeHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${product.name}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 10px;
            }
            .barcode-container {
              text-align: center;
              margin: 20px;
            }
            .product-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .product-price {
              font-size: 16px;
              font-weight: bold;
              color: #1e40af;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${product.name}</div>
            ${barcodeRef.current?.innerHTML || ''}
            <div class="product-price">Rp ${product.selling_price?.toLocaleString('id-ID')}</div>
          </div>
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

    printWindow.document.write(barcodeHTML);
    printWindow.document.close();
  };

  if (!product.barcode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Barcode Produk</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            Produk ini belum memiliki barcode
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode Produk</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-4">SKU: {product.barcode}</p>
          </div>

          <div ref={barcodeRef} className="flex justify-center bg-white p-4 rounded-lg border">
            <Barcode value={product.barcode} format="CODE128" />
          </div>

          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">
              Rp {product.selling_price?.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Tutup
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Barcode
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductBarcodeModal;
