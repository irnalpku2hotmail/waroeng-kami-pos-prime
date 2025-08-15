
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Package, Minus, Plus, Trash2, MapPin, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartModal = ({ open, onOpenChange }: CartModalProps) => {
  const { items, getTotalItems, getTotalPrice, customerInfo, setCustomerInfo, clearCart, updateQuantity, removeItem } = useCart();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch COD settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  // Auto-fill customer info from user profile including address_text
  useEffect(() => {
    if (user && profile) {
      setCustomerInfo({
        name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || user.email || '',
        address: profile.address_text || profile.address || '' // Prioritize address_text
      });
    }
  }, [user, profile, setCustomerInfo]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        throw new Error('Mohon lengkapi semua data pengiriman');
      }

      if (items.length === 0) {
        throw new Error('Keranjang belanja kosong');
      }

      // Get delivery fee from settings
      const deliveryFee = settings?.cod_settings?.delivery_fee || 10000;
      
      // Generate order number
      const timestamp = Date.now();
      const orderNumber = `WEB${timestamp}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          total_amount: getTotalPrice() + deliveryFee,
          delivery_fee: deliveryFee,
          payment_method: 'cod',
          status: 'pending',
          notes: 'Pesanan dari website',
          customer_id: user?.id || null
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

      return order;
    },
    onSuccess: (order) => {
      toast({
        title: 'Pesanan Berhasil Dibuat! 🎉',
        description: `Nomor pesanan: ${order.order_number}. Kami akan menghubungi Anda segera.`,
      });
      clearCart();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      console.error('Error creating order:', error);
      toast({
        title: 'Gagal Membuat Pesanan',
        description: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmitOrder = () => {
    setIsSubmitting(true);
    createOrderMutation.mutate();
    setIsSubmitting(false);
  };

  // Calculate totals with delivery fee
  const subtotal = getTotalPrice();
  const deliveryFee = settings?.cod_settings?.delivery_fee || 10000;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] mx-2' : 'max-w-md'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Keranjang Belanja
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keranjang Kosong</h3>
            <p className="text-gray-600 mb-6 text-sm">Belum ada produk di keranjang Anda</p>
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
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh] mx-2' : 'max-w-2xl max-h-[90vh]'} overflow-hidden`}>
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            Keranjang Belanja
            <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 py-1 rounded-full">
              {getTotalItems()} item
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] space-y-4 sm:space-y-6">
          {/* Cart Items */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produk Pesanan
            </h3>
            {items?.map((item) => (
              <Card key={item.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className={`flex items-center gap-3 ${isMobile ? 'flex-col space-y-3' : ''}`}>
                    <div className="flex-shrink-0">
                      <div className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} bg-gray-100 rounded-lg overflow-hidden`}>
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
                    
                    <div className={`flex-1 min-w-0 ${isMobile ? 'text-center' : ''}`}>
                      <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(item.price)}
                      </p>
                      <p className="text-xs text-gray-500">Stok: {item.stock}</p>
                    </div>
                    
                    <div className={`flex items-center gap-3 ${isMobile ? 'justify-center w-full' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
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
              <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Pengiriman
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <User className="h-3 w-3" />
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
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
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
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
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
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Alamat Lengkap *
                  </Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Alamat akan terisi otomatis dari profil, atau masukkan alamat lengkap"
                    rows={isMobile ? 2 : 3}
                    className="mt-1"
                  />
                  {profile?.address_text && (
                    <p className="text-xs text-blue-600 mt-1">
                      📍 Alamat dari profil: {profile.address_text.slice(0, 50)}...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Action */}
        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal ({getTotalItems()} item)</span>
              <span className="font-medium">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Ongkos Kirim
              </span>
              <span className="font-medium">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>Total</span>
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(total)}
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Pembayaran</p>
            <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium inline-block">
              💰 Cash on Delivery (COD)
            </div>
          </div>

          <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Lanjut Belanja
            </Button>
            <Button 
              onClick={handleSubmitOrder}
              disabled={isSubmitting || createOrderMutation.isPending || !customerInfo.name || !customerInfo.phone || !customerInfo.address}
              className={`flex-1 bg-blue-600 hover:bg-blue-700 ${isMobile ? 'py-3' : ''} text-base font-semibold`}
            >
              {isSubmitting || createOrderMutation.isPending ? 'Memproses Pesanan...' : '🛒 Pesan Sekarang'}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Dengan memesan, Anda menyetujui syarat dan ketentuan kami
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
