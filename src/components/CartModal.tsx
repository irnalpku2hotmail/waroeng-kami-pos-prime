
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Package, Minus, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartModal = ({ open, onOpenChange }: CartModalProps) => {
  const { items, getTotalItems, getTotalPrice, customerInfo, setCustomerInfo, clearCart, updateQuantity, removeItem } = useCart();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return data?.value || {};
    }
  });

  // Auto-fill customer info from user profile
  useEffect(() => {
    if (user && profile) {
      setCustomerInfo({
        name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || user.email || '',
        address: profile.address_text || '' // Mengambil dari address_text
      });
    }
  }, [user, profile, setCustomerInfo]);

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua data pengiriman',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Keranjang belanja kosong',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const timestamp = Date.now();
      const orderNumber = `ORD${timestamp}`;

      // Get delivery fee from COD settings
      const deliveryFee = codSettings?.delivery_fee || 10000;
      const total = getTotalPrice() + deliveryFee;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          total_amount: total,
          delivery_fee: deliveryFee,
          payment_method: 'cod',
          status: 'pending',
          notes: 'Pesanan dari website'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Berhasil!',
        description: 'Pesanan berhasil dibuat. Kami akan menghubungi Anda segera.',
      });

      clearCart();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat pesanan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFee = codSettings?.delivery_fee || 10000;
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Keranjang Belanja
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keranjang Kosong</h3>
            <p className="text-gray-600 mb-6">Belum ada produk di keranjang Anda</p>
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Mulai Belanja
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] mx-4 overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Keranjang Belanja
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              {getTotalItems()} item
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] space-y-6">
          {/* Cart Items */}
          <div className="space-y-3">
            {items?.map((item) => (
              <Card key={item.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
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
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(item.price)}
                      </p>
                      <p className="text-xs text-gray-500">Stok: {item.stock}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                          className="h-8 w-8 p-0 rounded-full"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Customer Information */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 text-gray-900">Informasi Pengiriman</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Nama Lengkap *
                  </Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Masukkan nama lengkap"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Nomor Telepon *
                  </Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Masukkan nomor telepon"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Masukkan email"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Alamat Lengkap *
                  </Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Masukkan alamat lengkap dengan detail"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Action */}
        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkos Kirim</span>
              <span>{new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span className="text-blue-600">{new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(total)}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Pembayaran</p>
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium inline-block">
              Cash on Delivery (COD)
            </div>
          </div>

          <Button 
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !customerInfo.name || !customerInfo.phone || !customerInfo.address}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg font-semibold"
          >
            {isSubmitting ? 'Memproses Pesanan...' : 'Pesan Sekarang'}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            Dengan memesan, Anda menyetujui syarat dan ketentuan kami
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
