
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { CartItem, getImageUrl } from '@/hooks/usePOS';

interface CartItemsListProps {
  cart: CartItem[];
  updateCartQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
}

const CartItemsList: React.FC<CartItemsListProps> = ({ cart, updateCartQuantity, removeFromCart }) => {
  if (cart.length === 0) {
    return <p className="text-gray-500 text-center py-4">Keranjang kosong</p>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {cart.map((item) => {
        const itemImageUrl = getImageUrl(item.image_url);
        return (
          <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
            {itemImageUrl && (
              <img src={itemImageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-gray-500">
                Rp {item.unit_price.toLocaleString('id-ID')} | {item.loyalty_points}pts
                {item.price_variant && (
                  <span className="ml-1 text-blue-600">({item.price_variant.name})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="destructive" className="h-6 w-6 p-0 ml-1" onClick={() => removeFromCart(item.product_id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartItemsList;
