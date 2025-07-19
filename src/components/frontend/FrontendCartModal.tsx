
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, MapPin, User, Phone } from 'lucide-react';
import { useCartWithShipping } from '@/hooks/useCartWithShipping';
import { toast } from '@/hooks/use-toast';

interface FrontendCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FrontendCartModal = ({ isOpen, onClose }: FrontendCartModalProps) => {
  const { items, updateQuantity, removeItem, getTotalPrice, shippingInfo } = useCartWithShipping();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleCheckout = () => {
    if (!shippingInfo) {
      toast({
        title: 'Informasi pengiriman belum lengkap',
        description: 'Silakan lengkapi profil Anda terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    // Here you would typically navigate to checkout
    toast({
      title: 'Checkout',
      description: 'Fitur checkout akan segera tersedia'
    });
  };

  const deliveryFee = 10000;
  const totalPrice = getTotalPrice();
  const grandTotal = totalPrice + deliveryFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Keranjang Belanja</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keranjang Anda kosong
            </div>
          ) : (
            <div className="space-y-4">
              {/* Shipping Information */}
              {shippingInfo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Informasi Pengiriman
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-2" />
                      {shippingInfo.name}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-2" />
                      {shippingInfo.phone || 'Tidak ada nomor telepon'}
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-3 w-3 mr-2 mt-0.5" />
                      {shippingInfo.address || 'Alamat belum diatur'}
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir:</span>
                  <span>Rp {deliveryFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex space-x-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Tutup
          </Button>
          <Button 
            onClick={handleCheckout} 
            className="flex-1"
            disabled={items.length === 0}
          >
            Checkout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FrontendCartModal;
