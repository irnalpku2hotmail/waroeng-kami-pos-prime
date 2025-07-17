
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Minus, Plus, Trash2, MapPin, Phone, User, CreditCard, Truck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CODSettings {
  is_enabled?: boolean;
  minimum_order_amount?: number;
  additional_fee?: number;
}

const CartModal = ({ open, onOpenChange }: CartModalProps) => {
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user profile for auto-fill
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch COD settings
  const { data: codSettings } = useQuery({
    queryKey: ['cod-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'cod_settings')
        .single();
      if (error) throw error;
      return (data?.value as CODSettings) || {};
    }
  });

  // Auto-fill customer info from profile
  React.useEffect(() => {
    if (profile) {
      setCustomerInfo(prev => ({
        ...prev,
        name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address_text || profile.address || ''
      }));
    }
  }, [profile]);

  const deliveryFee = 10000; // Default delivery fee
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;

  // Check if COD is enabled and meets minimum order
  const isCODEnabled = codSettings?.is_enabled && total >= (codSettings?.minimum_order_amount || 0);

  const handleSubmitOrder = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Silakan login terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi informasi pengiriman',
        variant: 'destructive'
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Keranjang kosong',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          notes: customerInfo.notes || '',
          total_amount: total,
          delivery_fee: deliveryFee,
          payment_method: paymentMethod,
          status: 'pending',
          order_number: `ORD${Date.now()}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Berhasil!',
        description: 'Pesanan berhasil dibuat',
      });

      clearCart();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat pesanan',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang Belanja ({items.length})
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keranjang kosong</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">{formatPrice(item.unit_price)}</p>
                    <Badge variant="outline" className="mt-1">
                      Stok: {item.stock}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.total_price)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Penerima
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Textarea
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  placeholder="Masukkan alamat lengkap untuk pengiriman"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                  placeholder="Catatan tambahan untuk pesanan"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Metode Pembayaran
              </h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" disabled={!isCODEnabled} />
                  <Label htmlFor="cod" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Cash on Delivery (COD)
                    {!isCODEnabled && (
                      <Badge variant="destructive" className="text-xs">
                        Minimum {formatPrice(codSettings?.minimum_order_amount || 0)}
                      </Badge>
                    )}
                  </Label>
                </div>
                {(codSettings?.additional_fee || 0) > 0 && (
                  <p className="text-sm text-gray-600 ml-6">
                    Biaya tambahan: {formatPrice(codSettings?.additional_fee || 0)}
                  </p>
                )}
              </RadioGroup>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Pengiriman</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              {paymentMethod === 'cod' && (codSettings?.additional_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Biaya COD</span>
                  <span>{formatPrice(codSettings?.additional_fee || 0)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total + (paymentMethod === 'cod' && codSettings?.additional_fee ? codSettings.additional_fee : 0))}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !isCODEnabled}
              className="w-full"
            >
              {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
