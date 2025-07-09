
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

const CartModal = ({ open, onClose }: CartModalProps) => {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCart();
  const { user } = useAuth();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const totalPrice = getTotalPrice();

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang Belanja
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Silakan login terlebih dahulu untuk menggunakan keranjang belanja</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang Belanja
            {items.length > 0 && (
              <Badge variant="secondary">{items.length} item</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col max-h-[60vh]">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Keranjang belanja kosong</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        Rp {item.unit_price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-gray-400">
                        Stok: {item.current_stock}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.current_stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">
                        Rp {item.total_price.toLocaleString('id-ID')}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Lanjut Belanja
                  </Button>
                  <Button className="flex-1">
                    Checkout
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
