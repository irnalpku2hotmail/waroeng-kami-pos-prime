
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import FrontendCart from './FrontendCart';

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartModal = ({ open, onOpenChange }: CartModalProps) => {
  const { items, getTotalItems } = useCart();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang Belanja ({getTotalItems()})
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <FrontendCart />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
