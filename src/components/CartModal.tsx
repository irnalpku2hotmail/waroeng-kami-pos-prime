
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Minus, Plus, Trash2, Package, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartModal = ({ open, onOpenChange }: CartModalProps) => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Get user profile data
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

  // Auto-fill form when profile data is loaded
  useState(() => {
    if (profile) {
      setCustomerName(profile.full_name || '');
      setCustomerPhone(profile.phone || '');
      setCustomerEmail(profile.email || '');
      setCustomerAddress(profile.address_text || '');
    }
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        notes,
        total_amount: getTotalPrice() + 10000, // Including delivery fee
        delivery_fee: 10000,
        payment_method: 'cod',
        status: 'pending'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
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

      return order;
    },
    onSuccess: (order) => {
      toast({
        title: 'Pesanan berhasil dibuat!',
        description: `Pesanan #${order.order_number} akan segera diproses`,
      });
      clearCart();
      setShowOrderForm(false);
      onOpenChange(false);
      navigate('/order-history');
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat pesanan. Silakan coba lagi.',
        variant: 'destructive'
      });
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleOrder = () => {
    if (!user) {
      toast({
        title: 'Silakan login terlebih dahulu',
        description: 'Anda harus login untuk melakukan pemesanan',
        variant: 'destructive'
      });
      return;
    }
    setShowOrderForm(true);
  };

  const handleSubmitOrder = () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast({
        title: 'Data tidak lengkap',
        description: 'Silakan lengkapi semua data yang diperlukan',
        variant: 'destructive'
      });
      return;
    }
    createOrder.mutate();
  };

  if (showOrderForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informasi Pengiriman</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nama Lengkap *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Nomor Telepon *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Masukkan email"
              />
            </div>

            <div>
              <Label htmlFor="customerAddress">Alamat Pengiriman *</Label>
              <Textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Masukkan alamat lengkap"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Catatan Pesanan</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan untuk pesanan"
                rows={2}
              />
            </div>

            {/* Order Summary */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Ringkasan Pesanan</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Pengiriman:</span>
                    <span>{formatPrice(10000)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(getTotalPrice() + 10000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOrderForm(false)}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                onClick={handleSubmitOrder}
                disabled={createOrder.isPending}
                className="flex-1"
              >
                {createOrder.isPending ? 'Memproses...' : 'Pesan Sekarang'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keranjang belanja kosong</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-blue-600 font-semibold">
                          {formatPrice(item.unit_price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stok: {item.stock}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                          disabled={item.quantity >= item.stock}
                          className="h-8 w-8"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-right">
                      <p className="font-semibold text-blue-600">
                        {formatPrice(item.total_price)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Total */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatPrice(getTotalPrice())}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearCart}
                className="flex-1"
              >
                Kosongkan Keranjang
              </Button>
              <Button
                onClick={handleOrder}
                className="flex-1"
              >
                Pesan Sekarang
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
