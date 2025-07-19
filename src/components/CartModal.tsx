import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Package,
  MapPin,
  User,
  Phone,
  Truck
} from 'lucide-react';

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartModal = ({ open, onOpenChange }: CartModalProps) => {
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalItems } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user profile for shipping info
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
    enabled: !!user?.id && open
  });

  // Auto-fill customer info from profile
  useState(() => {
    if (profile && open) {
      setCustomerName(profile.full_name || '');
      setCustomerPhone(profile.phone || '');
      setCustomerAddress(profile.address_text || profile.address || '');
    }
  });

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomNum}`;
  };

  const handleCreateOrder = async () => {
    if (items.length === 0) {
      toast({
        title: 'Keranjang Kosong',
        description: 'Tambahkan produk ke keranjang terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    if (!customerName || !customerPhone || !customerAddress) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Harap lengkapi semua data pengiriman',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const deliveryFee = 10000;
      const totalAmount = getTotalPrice() + deliveryFee;
      const orderNumber = generateOrderNumber();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          customer_id: user?.id || null,
          total_amount: totalAmount,
          delivery_fee: deliveryFee,
          notes: notes,
          status: 'pending',
          payment_method: 'cod'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id || item.id,
        quantity: item.quantity,
        unit_price: item.unit_price || item.price,
        total_price: item.total_price || (item.price * item.quantity)
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Pesanan Berhasil!',
        description: `Pesanan ${order.order_number} telah dibuat. Kami akan segera memproses pesanan Anda.`,
      });

      clearCart();
      onOpenChange(false);
      
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setNotes('');

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Gagal Membuat Pesanan',
        description: 'Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const deliveryFee = 10000;
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang Belanja ({getTotalItems()} item)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cart Items */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Produk Pesanan</h3>
            
            {items.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Keranjang belanja kosong</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
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
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                          <p className="text-blue-600 font-semibold">
                            {formatPrice(item.price)}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Order Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informasi Pengiriman</h3>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Data dari Profil</span>
                </div>
                {profile ? (
                  <div className="text-sm text-blue-700">
                    <p><strong>Nama:</strong> {profile.full_name || 'Belum diisi'}</p>
                    <p><strong>Telepon:</strong> {profile.phone || 'Belum diisi'}</p>
                    <p><strong>Alamat:</strong> {profile.address_text || profile.address || 'Belum diisi'}</p>
                    {profile.latitude && profile.longitude && (
                      <p><strong>Koordinat:</strong> {profile.latitude}, {profile.longitude}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-blue-600">Login untuk menggunakan data profil</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nama Penerima
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama penerima"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor Telepon
                </Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat Lengkap
                </Label>
                <Textarea
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap pengiriman"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Pesanan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk pesanan Anda"
                  rows={2}
                />
              </div>
            </div>

            {/* Order Summary */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Ringkasan Pesanan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({getTotalItems()} item)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      Ongkos Kirim
                    </span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">COD</Badge>
                    <span className="text-sm">Bayar saat barang tiba</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateOrder}
                  disabled={loading || items.length === 0}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? 'Memproses...' : `Buat Pesanan - ${formatPrice(total)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
