
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface ProductQRModalProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductQRModal = ({ product, open, onOpenChange }: ProductQRModalProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (product && open) {
      const generateQRCode = async () => {
        try {
          // Generate QR code with product information
          const productInfo = {
            id: product.id,
            name: product.name,
            barcode: product.barcode || product.id,
            price: product.selling_price,
            category: product.categories?.name || 'Tidak ada kategori'
          };
          
          const qrData = JSON.stringify(productInfo);
          const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(qrCodeDataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      };

      generateQRCode();
    }
  }, [product, open]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${product?.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
              }
              .qr-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              .product-info {
                border: 1px solid #ccc;
                padding: 15px;
                border-radius: 8px;
                max-width: 400px;
              }
              img {
                max-width: 300px;
                height: auto;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>${product?.name}</h2>
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="product-info">
                <p><strong>Nama Produk:</strong> ${product?.name}</p>
                <p><strong>Barcode:</strong> ${product?.barcode || product?.id}</p>
                <p><strong>Harga:</strong> Rp ${product?.selling_price?.toLocaleString('id-ID')}</p>
                <p><strong>Kategori:</strong> ${product?.categories?.name || 'Tidak ada kategori'}</p>
                <p><strong>Stok:</strong> ${product?.current_stock}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Produk
          </DialogTitle>
        </DialogHeader>
        
        {product && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              {qrCodeUrl && (
                <div className="flex justify-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border rounded" />
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Barcode:</span>
                <span>{product.barcode || product.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Harga:</span>
                <span>Rp {product.selling_price?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Kategori:</span>
                <span>{product.categories?.name || 'Tidak ada kategori'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Stok:</span>
                <span>{product.current_stock}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print QR Code
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Tutup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductQRModal;
