
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, Package } from 'lucide-react';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
  loyalty_points: number;
  price_variant?: {
    id: string;
    name: string;
    price: number;
    minimum_quantity: number;
  };
}

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
      {cart.map((item) => (
        <div key={item.product_id} className="flex items-center gap-2 p-2 border rounded">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded" />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
              <Package className="h-4 w-4 text-gray-400" />
            </div>
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
      ))}
    </div>
  );
};

export default CartItemsList;
