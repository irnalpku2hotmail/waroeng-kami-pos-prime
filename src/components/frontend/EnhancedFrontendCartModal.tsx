
import { useState, useEffect } from 'react';
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
import { Minus, Plus, Trash2, ShoppingCart, MapPin, Phone, User, Package, Truck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnhancedFrontendCartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CODSettings {
  delivery_fee?: number;
  free_shipping_minimum?: number;
  service_fee?: number;
}

const EnhancedFrontendCartModal = ({ open, onOpenChange }: EnhancedFrontendCartModalProps) => {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address_text || profile?.address || '',
    notes: ''
  });

  // Update customer info when profile changes
  useEffect(() => {
    setCustomerInfo({
      name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address_text || profile?.address || '',
      notes: ''
    });
  }, [profile]);

  // Fetch COD settings
  const { data: codSettings } = useQuery({
    queryKey: ['cod-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'cod_settings')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.value || { delivery_fee: 10000, free_shipping_minimum: 100000, service_fee: 5000 };
    }
  });

  // Fetch products with service fee info
  const { data: productsWithServiceFee } = useQuery({
    queryKey: ['products-service-fee', items.map(item => item.id)],
    queryFn: async () => {
      if (items.length === 0) return [];
      
      const productIds = items.map(item => item.product_id || item.id);
      const { data, error } = await supabase
        .from('products')
        .select('id, has_service_fee')
        .in('id', productIds)
        .eq('has_service_fee', true);

      if (error) throw error;
      return data;
    },
    enabled: items.length > 0
  });

  // Fetch price variants for products
  const { data: priceVariants } = useQuery({
    queryKey: ['price-variants', items.map(item => item.id)],
    queryFn: async () => {
      if (items.length === 0) return [];
      
      const productIds = items.map(item => item.id);
      const { data, error } = await supabase
        .from('price_variants')
        .select('*')
        .in('product_id', productIds)
        .eq('is_active', true)
        .order('minimum_quantity', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: items.length > 0
  });

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    return `WEB-${timestamp}`;
  };

  // Calculate best price for each item based on quantity and variants
  const getItemPrice = (item: any) => {
    if (!priceVariants) return item.price;
    
    const itemVariants = priceVariants.filter(v => v.product_id === item.id);
    if (itemVariants.length === 0) return item.price;

    // Find the best variant for current quantity
    const applicableVariants = itemVariants.filter(v => item.quantity >= v.minimum_quantity);
    if (applicableVariants.length === 0) return item.price;

    // Return the variant with highest minimum quantity (best price)
    const bestVariant = applicableVariants.reduce((best, current) => 
      current.minimum_quantity > best.minimum_quantity ? current : best
    );

    return bestVariant.price;
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('Silakan login terlebih dahulu');
      }

      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        throw new Error('Mohon lengkapi semua data pengiriman yang wajib diisi');
      }

      // Cast COD settings to proper type
      const orderSettings = codSettings as CODSettings;
      const orderDeliveryFee = orderSettings?.delivery_fee || 10000;
      const orderFreeShippingMinimum = orderSettings?.free_shipping_minimum || 100000;
      const orderServiceFeeAmount = orderSettings?.service_fee || 5000;
      const orderSubtotal = getTotalPriceWithVariants();
      const orderFinalDeliveryFee = orderSubtotal >= orderFreeShippingMinimum ? 0 : orderDeliveryFee;
      
      // Check if any product in cart has service fee
      const hasServiceFee = productsWithServiceFee && productsWithServiceFee.length > 0;
      const orderServiceFee = hasServiceFee ? orderServiceFeeAmount : 0;
      
      const totalAmount = orderSubtotal + orderFinalDeliveryFee + orderServiceFee;
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          notes: customerInfo.notes ? `${customerInfo.notes}${orderServiceFee > 0 ? ` | Biaya Layanan: Rp ${orderServiceFee.toLocaleString('id-ID')}` : ''}` : (orderServiceFee > 0 ? `Biaya Layanan: Rp ${orderServiceFee.toLocaleString('id-ID')}` : 'Pesanan dari website'),
          total_amount: totalAmount,
          delivery_fee: orderFinalDeliveryFee,
          payment_method: 'cod',
          status: 'pending',
          customer_id: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id || item.id,
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        total_price: getItemPrice(item) * item.quantity
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

  const getTotalPriceWithVariants = () => {
    return items.reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  // Cast COD settings to proper type for calculations
  const codSettingsTyped = codSettings as CODSettings;
  const deliveryFee = codSettingsTyped?.delivery_fee || 10000;
  const freeShippingMinimum = codSettingsTyped?.free_shipping_minimum || 100000;
  const serviceFeeAmount = codSettingsTyped?.service_fee || 5000;
  const subtotal = getTotalPriceWithVariants();
  const finalDeliveryFee = subtotal >= freeShippingMinimum ? 0 : deliveryFee;
  
  // Check if any product in cart has service fee
  const hasServiceFeeProduct = productsWithServiceFee && productsWithServiceFee.length > 0;
  const serviceFee = hasServiceFeeProduct ? serviceFeeAmount : 0;
  
  const total = subtotal + finalDeliveryFee + serviceFee;
  const isEligibleForFreeShipping = subtotal >= freeShippingMinimum;

  if (!user) {
    return null; // Don't show cart modal if not logged in
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
            {/* Free Shipping Banner */}
            {!isEligibleForFreeShipping && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Truck className="h-5 w-5 inline mr-2 text-blue-600" />
                <span className="text-blue-800 text-sm">
                  Belanja {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(freeShippingMinimum - subtotal)} lagi untuk gratis ongkir!
                </span>
              </div>
            )}

            {isEligibleForFreeShipping && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <Truck className="h-5 w-5 inline mr-2 text-green-600" />
                <span className="text-green-800 text-sm font-medium">
                  🎉 Selamat! Anda mendapat gratis ongkir
                </span>
              </div>
            )}

            {/* Cart Items */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produk Pesanan
              </h3>
              {items.map((item) => {
                const itemPrice = getItemPrice(item);
                const savings = (item.price - itemPrice) * item.quantity;
                
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className={`flex items-center gap-4 ${isMobile ? 'flex-col space-y-3' : ''}`}>
                        <img
                          src={getImageUrl(item.product?.image_url || item.image)}
                          alt={item.product?.name || item.name}
                          className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} object-cover rounded-md`}
                        />
                        <div className={`flex-1 ${isMobile ? 'text-center' : ''}`}>
                          <h4 className="font-medium">{item.product?.name || item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-medium text-blue-600">
                              Rp {itemPrice.toLocaleString('id-ID')}
                            </p>
                            {itemPrice < item.price && (
                              <p className="text-xs text-gray-500 line-through">
                                Rp {item.price.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                          {savings > 0 && (
                            <p className="text-xs text-green-600">
                              Hemat Rp {savings.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product_id || item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product_id || item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.product_id || item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator />

            {/* Customer Information - Read only */}
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
                      Nama Lengkap
                    </Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Nomor Telepon
                    </Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Alamat Lengkap
                  </Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    readOnly
                    className="bg-gray-50"
                    rows={isMobile ? 2 : 3}
                  />
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
                <span className={isEligibleForFreeShipping ? 'text-green-600' : ''}>
                  {isEligibleForFreeShipping ? (
                    <>
                      <span className="line-through text-gray-400">Rp {deliveryFee.toLocaleString('id-ID')}</span>
                      <span className="ml-2 font-medium">GRATIS</span>
                    </>
                  ) : (
                    `Rp ${finalDeliveryFee.toLocaleString('id-ID')}`
                  )}
                </span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Biaya Layanan
                  </span>
                  <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
                </div>
              )}
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

export default EnhancedFrontendCartModal;
