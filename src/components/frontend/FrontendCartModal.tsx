
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart, MapPin, Phone, User, Mail, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface FrontendCartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FrontendCartModal = ({ open, onOpenChange }: FrontendCartModalProps) => {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address_text || profile?.address || '', // Prioritize address_text
    notes: ''
  });

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

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    return `WEB-${timestamp}`;
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('Silakan login terlebih dahulu');
      }

      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        throw new Error('Mohon lengkapi semua data pengiriman yang wajib diisi');
      }

      const deliveryFee = settings?.delivery_fee?.amount || 10000;
      const totalAmount = getTotalPrice() + deliveryFee;
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          notes: customerInfo.notes || 'Pesanan dari website',
          total_amount: totalAmount,
          delivery_fee: deliveryFee,
          payment_method: 'cod',
          status: 'pending',
          customer_id: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
        title: 'Pesanan Berhasil! 🎉',
        description: `Nomor pesanan: ${order.order_number}. Pesanan Anda sedang diproses.`
      });
      clearCart();
      setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  const deliveryFee = settings?.delivery_fee?.amount || 10000;
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] mx-2' : 'max-w-md'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang Belanja
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Silakan login untuk menggunakan keranjang belanja</p>
            <Button onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh] mx-2' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang Belanja
            {items.length > 0 && (
              <Badge className="ml-2">{items.length} item</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Keranjang belanja kosong</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produk Pesanan
              </h3>
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className={`flex items-center gap-4 ${isMobile ? 'flex-col space-y-3' : ''}`}>
                      <img
                        src={getImageUrl(item.product?.image_url)}
                        alt={item.product?.name || 'Product'}
                        className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} object-cover rounded-md`}
                      />
                      <div className={`flex-1 ${isMobile ? 'text-center' : ''}`}>
                        <h4 className="font-medium">{item.product?.name || 'Product'}</h4>
                        <p className="text-sm text-gray-600">
                          Rp {item.unit_price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.product_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pengiriman
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Nama Lengkap *
                    </Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Nomor Telepon *
                    </Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Alamat Lengkap *
                  </Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, address: e.target.value}))}
                    placeholder="Alamat akan terisi otomatis dari profil, atau masukkan alamat lengkap untuk pengiriman"
                    required
                    rows={isMobile ? 2 : 3}
                  />
                  {profile?.address_text && (
                    <p className="text-xs text-blue-600 mt-1">
                      📍 Alamat dari profil: {profile.address_text.slice(0, 50)}...
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Catatan tambahan untuk pesanan"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Ongkos Kirim
                </span>
                <span>Rp {deliveryFee.toLocaleString('id-ID')}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium inline-block">
                  💰 Cash on Delivery (COD)
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Lanjut Belanja
              </Button>
              <Button
                onClick={() => createOrder.mutate()}
                disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address || createOrder.isPending}
                className={`flex-1 bg-blue-600 hover:bg-blue-700 ${isMobile ? 'py-3 text-base' : ''} font-semibold`}
              >
                {createOrder.isPending ? 'Memproses...' : '🛒 Pesan Sekarang'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FrontendCartModal;
