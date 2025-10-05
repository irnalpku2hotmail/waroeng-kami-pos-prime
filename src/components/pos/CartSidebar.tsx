
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import CartItemsList from './CartItemsList';
import PaymentDetails from './PaymentDetails';
import { usePOS } from '@/hooks/usePOS';

type CartSidebarProps = ReturnType<typeof usePOS>;

const CartSidebar: React.FC<CartSidebarProps> = (props) => {
  return (
    <div className="w-96 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang ({props.cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomerSelector 
            customers={props.customers}
            selectedCustomer={props.selectedCustomer}
            setSelectedCustomer={props.setSelectedCustomer}
          />
          <CartItemsList
            cart={props.cart}
            updateCartQuantity={props.updateCartQuantity}
            removeFromCart={props.removeFromCart}
          />
          <PaymentDetails 
            {...props}
            printReceipt={props.printReceipt}
            user={props.user}
            settings={props.settings}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CartSidebar;
