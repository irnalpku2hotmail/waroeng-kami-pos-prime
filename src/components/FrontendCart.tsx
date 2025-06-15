
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, Package } from 'lucide-react';

const FrontendCart = () => {
  const { user } = useAuth();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalItems, 
    getTotalPrice,
    customerInfo,
    setCustomerInfo,
    shippingCost,
    setShippingCost
  } = useCart();
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Fetch COD settings
  const { data: codSettings } = useQuery({
    queryKey: ['cod-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'cod_settings')
        .single();
      if (error) {
        return { enabled: true, delivery_fee: 10000, min_order: 50000 };
      }
      return data.value;
    }
  });

  // Fetch user profile to sync with customer info
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

  // Set shipping cost based on COD settings
  React.useEffect(() => {
    if (codSettings?.enabled && getTotalPrice() >= (codSettings.min_order || 0)) {
      setShippingCost(codSettings.delivery_fee || 10000);
    } else {
      setShippingCost(0);
    }
  }, [codSettings, getTotalPrice(), setShippingCost]);

  // Sync customer info with profile when available
  React.useEffect(() => {
    if (profile) {
      setCustomerInfo({
        name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        email: profile.email || ''
      });
    }
  }, [profile, setCustomerInfo]);

  const createOrder = useMutation({
    mutationFn: async () => {
      const totalAmount = getTotalPrice() + shippingCost;
      
      // Generate order number
      const orderNumber = `ORD${Date.now()}`;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          total_amount: totalAmount,
          delivery_fee: shippingCost,
          payment_method: 'cod',
          status: 'pending',
          notes: orderNotes
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

      return order;
    },
    onSuccess: (order) => {
      toast({
        title: 'Order Berhasil Dibuat',
        description: `Order ${order.order_number} telah dibuat. Tim kami akan segera menghubungi Anda.`
      });
      clearCart();
      setOrderNotes('');
      setIsCheckoutOpen(false);
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
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: 'Informasi Tidak Lengkap',
        description: 'Mohon lengkapi nama, nomor telepon, dan alamat pengiriman.',
        variant: 'destructive'
      });
      return;
    }
    
    createOrder.mutate();
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">Keranjang Anda kosong</p>
          <p className="text-sm text-gray-400 text-center mt-2">
            Tambahkan produk untuk melanjutkan belanja
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Keranjang ({getTotalItems()})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {items.map((item) => {
            const itemImageUrl = getImageUrl(item.image_url);
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {itemImageUrl && (
                  <img 
                    src={itemImageUrl} 
                    alt={item.name} 
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                {!itemImageUrl && (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Rp {item.unit_price.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    Total: Rp {item.total_price.toLocaleString('id-ID')}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="h-8 w-8 p-0 ml-2"
                    onClick={() => removeItem(item.product_id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total & Shipping */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">Rp {getTotalPrice().toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Ongkos Kirim:</span>
            <span className="font-medium">
              {shippingCost === 0 ? (
                <Badge variant="secondary" className="text-green-600">Free Shipping</Badge>
              ) : (
                `Rp ${shippingCost.toLocaleString('id-ID')}`
              )}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>Rp {(getTotalPrice() + shippingCost).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              Checkout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Informasi Pengiriman</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Nama Lengkap *</Label>
                <Input
                  id="customer_name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              <div>
                <Label htmlFor="customer_phone">Nomor Telepon *</Label>
                <Input
                  id="customer_phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              
              <div>
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Masukkan email (opsional)"
                />
              </div>
              
              <div>
                <Label htmlFor="customer_address">Alamat Pengiriman *</Label>
                <Textarea
                  id="customer_address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="order_notes">Catatan Pesanan</Label>
                <Textarea
                  id="order_notes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                  rows={2}
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Pembayaran:</span>
                  <span>Rp {(getTotalPrice() + shippingCost).toLocaleString('id-ID')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pembayaran dilakukan saat barang tiba (COD)
                </p>
              </div>
              
              <Button 
                onClick={handleCheckout}
                disabled={createOrder.isPending}
                className="w-full"
                size="lg"
              >
                {createOrder.isPending ? 'Memproses...' : 'Buat Pesanan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FrontendCart;
