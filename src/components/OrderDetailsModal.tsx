
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Package, User, MapPin, Phone, Calendar, CreditCard, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OrderDetailsModalProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailsModal = ({ order, open, onOpenChange }: OrderDetailsModalProps) => {
  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
      preparing: { label: 'Disiapkan', variant: 'default' as const },
      shipping: { label: 'Dikirim', variant: 'default' as const },
      delivered: { label: 'Selesai', variant: 'default' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl;
  };

  const getStockStatusColor = (currentStock: number, minStock: number) => {
    if (currentStock <= minStock) {
      return 'text-red-600 font-semibold'; // Critical/Low stock
    } else if (currentStock <= minStock * 2) {
      return 'text-yellow-600 font-semibold'; // Warning stock
    } else {
      return 'text-green-600 font-semibold'; // Good stock
    }
  };

  const getStockBadge = (currentStock: number, minStock: number) => {
    if (currentStock <= minStock) {
      return <Badge variant="destructive" className="text-xs">Stok Kritis</Badge>;
    } else if (currentStock <= minStock * 2) {
      return <Badge className="bg-yellow-500 text-white text-xs">Stok Warning</Badge>;
    } else {
      return <Badge className="bg-green-500 text-white text-xs">Stok Baik</Badge>;
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Gagal membuka jendela print',
        variant: 'destructive'
      });
      return;
    }

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi - ${order.order_number}</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; }
          }
          body {
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 5mm;
            width: 70mm;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .separator { border-bottom: 1px dashed #000; margin: 5px 0; }
          .item { display: flex; justify-content: space-between; margin: 2px 0; }
          .total { font-weight: bold; font-size: 14px; }
          .header { margin-bottom: 10px; }
          .footer { margin-top: 10px; text-align: center; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold">TOKO RETAIL</div>
          <div>Jl. Contoh No. 123</div>
          <div>Telp: (021) 1234-5678</div>
        </div>
        
        <div class="separator"></div>
        
        <div>
          <div>No. Pesanan: ${order.order_number}</div>
          <div>Tanggal: ${new Date(order.order_date).toLocaleDateString('id-ID')}</div>
          <div>Pelanggan: ${order.customer_name}</div>
          ${order.customer_phone ? `<div>Telepon: ${order.customer_phone}</div>` : ''}
          <div>Status: ${getStatusBadge(order.status).props.children}</div>
          <div>Pembayaran: ${order.payment_method.toUpperCase()}</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="bold">ITEM PESANAN:</div>
        ${order.order_items?.map((item: any) => `
          <div>
            <div class="bold">${item.products?.name}</div>
            <div class="item">
              <span>${item.quantity} x Rp ${Number(item.unit_price).toLocaleString('id-ID')}</span>
              <span>Rp ${Number(item.total_price).toLocaleString('id-ID')}</span>
            </div>
          </div>
        `).join('') || ''}
        
        <div class="separator"></div>
        
        <div class="item">
          <span>Subtotal:</span>
          <span>Rp ${(Number(order.total_amount) - Number(order.delivery_fee)).toLocaleString('id-ID')}</span>
        </div>
        <div class="item">
          <span>Ongkir:</span>
          <span>Rp ${Number(order.delivery_fee).toLocaleString('id-ID')}</span>
        </div>
        <div class="separator"></div>
        <div class="item total">
          <span>TOTAL:</span>
          <span>Rp ${Number(order.total_amount).toLocaleString('id-ID')}</span>
        </div>
        
        ${order.customer_address ? `
          <div class="separator"></div>
          <div>
            <div class="bold">ALAMAT PENGIRIMAN:</div>
            <div>${order.customer_address}</div>
          </div>
        ` : ''}
        
        ${order.notes ? `
          <div class="separator"></div>
          <div>
            <div class="bold">CATATAN:</div>
            <div>${order.notes}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Terima kasih atas pesanan Anda!</div>
          <div>Dicetak: ${new Date().toLocaleString('id-ID')}</div>
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

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    
    toast({
      title: 'Berhasil',
      description: 'Kwitansi siap dicetak'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detail Pesanan {order.order_number}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintReceipt}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Kwitansi
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Status Pesanan:</span>
            {getStatusBadge(order.status)}
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informasi Pelanggan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nama:</span>
                <p>{order.customer_name}</p>
              </div>
              {order.customer_phone && (
                <div>
                  <span className="font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Telepon:
                  </span>
                  <p>{order.customer_phone}</p>
                </div>
              )}
              {order.customer_address && (
                <div className="md:col-span-2">
                  <span className="font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Alamat:
                  </span>
                  <p>{order.customer_address}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informasi Pesanan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Tanggal Pesanan:</span>
                <p>{new Date(order.order_date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              <div>
                <span className="font-medium flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Metode Pembayaran:
                </span>
                <p className="uppercase">{order.payment_method}</p>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <span className="font-medium">Catatan:</span>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="font-semibold">Item Pesanan</h3>
            <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <img 
                    src={getImageUrl(item.products?.image_url)} 
                    alt={item.products?.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.products?.name}</h4>
                    <p className="text-sm text-gray-500">
                      Rp {Number(item.unit_price).toLocaleString('id-ID')} x {item.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Stok saat ini:</span>
                      <span className={`text-xs ${getStockStatusColor(item.products?.current_stock || 0, item.products?.min_stock || 0)}`}>
                        {item.products?.current_stock || 0}
                      </span>
                      {getStockBadge(item.products?.current_stock || 0, item.products?.min_stock || 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Rp {Number(item.total_price).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold">Ringkasan Pesanan</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {(Number(order.total_amount) - Number(order.delivery_fee)).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span>Rp {Number(order.delivery_fee).toLocaleString('id-ID')}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>Rp {Number(order.total_amount).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
