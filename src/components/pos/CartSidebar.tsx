import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, WifiOff } from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import CartItemsList from './CartItemsList';
import PaymentDetails from './PaymentDetails';
import { usePOS } from '@/hooks/usePOS';
import { Badge } from '@/components/ui/badge';

type CartSidebarProps = ReturnType<typeof usePOS> & {
  onProcessTransaction?: () => void;
  isOffline?: boolean;
};

const CartSidebar: React.FC<CartSidebarProps> = (props) => {
  const { onProcessTransaction, isOffline, ...posProps } = props;
  
  return (
    <div className="w-96 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang ({posProps.cart.length})
            </div>
            {isOffline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomerSelector 
            customers={posProps.customers}
            selectedCustomer={posProps.selectedCustomer}
            setSelectedCustomer={posProps.setSelectedCustomer}
          />
          <CartItemsList
            cart={posProps.cart}
            updateCartQuantity={posProps.updateCartQuantity}
            removeFromCart={posProps.removeFromCart}
          />
          <PaymentDetails 
            {...posProps}
            printReceipt={posProps.printReceipt}
            user={posProps.user}
            settings={posProps.settings}
            onProcessTransaction={onProcessTransaction}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CartSidebar;
