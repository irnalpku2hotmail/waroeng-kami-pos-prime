
import React, { useState } from 'react';
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
import { ShoppingCart, Plus, Minus, Trash2, Package, Truck, Tag } from 'lucide-react';

interface CODSettings {
  enabled: boolean;
  delivery_fee: number;
  min_order: number;
}

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
        console.log('No COD settings found, using defaults');
        return { enabled: true, delivery_fee: 10000, min_order: 50000 } as CODSettings;
      }
      return data.value as unknown as CODSettings;
    }
  });

  // Fetch products with price variants for cart items
  const { data: productsWithVariants = [] } = useQuery({
    queryKey: ['cart-products-variants', items.map(item => item.product_id)],
    queryFn: async () => {
      if (items.length === 0) return [];
      
      const productIds = items.map(item => item.product_id);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          selling_price,
          price_variants(
            id,
            name,
            price,
            minimum_quantity,
            is_active
          )
        `)
        .in('id', productIds);
      
      if (error) throw error;
      return data;
    },
    enabled: items.length > 0
  });

  // Set shipping cost based on COD settings and cart total
  React.useEffect(() => {
    if (codSettings?.enabled && items.length > 0) {
      const cartTotal = getTotalPrice();
      if (cartTotal >= (codSettings.min_order || 0)) {
        setShippingCost(codSettings.delivery_fee || 10000);
      } else {
        setShippingCost(codSettings.delivery_fee || 10000);
      }
    } else {
      setShippingCost(0);
    }
  }, [codSettings, getTotalPrice(), items.length, setShippingCost]);

  const getBestPriceForQuantity = (productId: string, quantity: number) => {
    const product = productsWithVariants.find(p => p.id === productId);
    if (!product || !product.price_variants || product.price_variants.length === 0) {
      return {
        price: product?.selling_price || 0,
        isWholesale: false,
        variantName: null
      };
    }

    // Filter active variants and sort by minimum quantity descending
    const activeVariants = product.price_variants
      .filter((variant: any) => variant.is_active)
      .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity);

    // Find the best variant for the given quantity
    for (const variant of activeVariants) {
      if (quantity >= variant.minimum_quantity) {
        return {
          price: variant.price,
          isWholesale: true,
          variantName: variant.name
        };
      }
    }

    return {
      price: product.selling_price,
      isWholesale: false,
      variantName: null
    };
  };

  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    // Get the best price for the new quantity
    const priceInfo = getBestPriceForQuantity(productId, newQuantity);
    
    // Update the cart item with new price - this only affects the cart, not product stock
    updateQuantity(productId, newQuantity);
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      const totalAmount = getTotalPrice() + shippingCost;
      
      // Validate required fields
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        throw new Error('Nama, nomor telepon, dan alamat harus diisi');
      }

      if (items.length === 0) {
        throw new Error('Keranjang tidak boleh kosong');
      }
      
      // Generate order number
      const timestamp = Date.now();
      const orderNumber = `ORD${timestamp}`;
      
      console.log('Creating order with data:', {
        orderNumber,
        customerInfo,
        totalAmount,
        itemsCount: items.length
      });
      
      // Create order - this does NOT affect product stock
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
          status: 'pending', // Stock is only affected when status changes to 'delivered'
          notes: orderNotes || null
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Gagal membuat order: ${orderError.message}`);
      }

      console.log('Order created successfully:', order);

      // Create order items - this does NOT affect product stock
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        // Try to clean up the order if items insertion failed
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Gagal membuat item order: ${itemsError.message}`);
      }

      console.log('Order items created successfully');
      return order;
    },
    onSuccess: (order) => {
      toast({
        title: 'Order Berhasil Dibuat',
        description: `Order ${order.order_number} telah dibuat. Tim kami akan segera menghubungi Anda. Stok produk akan dikurangi saat pesanan dikirim.`
      });
      clearCart();
      setOrderNotes('');
      setIsCheckoutOpen(false);
    },
    onError: (error: any) => {
      console.error('Order creation failed:', error);
      toast({
        title: 'Gagal Membuat Order',
        description: error.message || 'Terjadi kesalahan saat membuat order',
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

  const cartTotal = getTotalPrice();
  const isFreeShipping = codSettings?.enabled && cartTotal >= (codSettings.min_order || 0);

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
            const currentPriceInfo = getBestPriceForQuantity(item.product_id, item.quantity);
            
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">
                      Rp {currentPriceInfo.price.toLocaleString('id-ID')}
                    </p>
                    {currentPriceInfo.isWholesale && (
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                        <Tag className="h-3 w-3 mr-1" />
                        {currentPriceInfo.variantName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-blue-600">
                    Total: Rp {(item.quantity * currentPriceInfo.price).toLocaleString('id-ID')}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityUpdate(item.product_id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityUpdate(item.product_id, item.quantity + 1)}
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
            <span className="font-medium">Rp {cartTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              Ongkos Kirim:
            </span>
            <span className="font-medium">
              {isFreeShipping ? (
                <Badge variant="secondary" className="text-green-600">Gratis Ongkir</Badge>
              ) : (
                `Rp ${shippingCost.toLocaleString('id-ID')}`
              )}
            </span>
          </div>
          {codSettings?.enabled && !isFreeShipping && codSettings.min_order > cartTotal && (
            <div className="text-xs text-gray-500">
              Belanja Rp {(codSettings.min_order - cartTotal).toLocaleString('id-ID')} lagi untuk gratis ongkir
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>Rp {(cartTotal + (isFreeShipping ? 0 : shippingCost)).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Truck className="h-4 w-4 mr-2" />
              Pesan Sekarang
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
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="customer_phone">Nomor Telepon *</Label>
                <Input
                  id="customer_phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Masukkan nomor telepon"
                  required
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
                  required
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
                  <span>Rp {(cartTotal + (isFreeShipping ? 0 : shippingCost)).toLocaleString('id-ID')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Pembayaran dilakukan saat barang tiba (COD). Stok akan dikurangi saat pesanan dikirim.
                </p>
              </div>
              
              <Button 
                onClick={handleCheckout}
                disabled={createOrder.isPending}
                className="w-full"
                size="lg"
              >
                {createOrder.isPending ? 'Memproses...' : 'Buat Pesanan COD'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FrontendCart;
