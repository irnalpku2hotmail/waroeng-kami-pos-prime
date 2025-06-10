
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Search, Mic, Plus, Minus, Trash2, CreditCard, Users, Receipt } from 'lucide-react';
import Layout from '@/components/Layout';

interface CartItem {
  product: any;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const POS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: 'Error',
          description: 'Gagal mengenali suara. Pastikan mikrofon aktif.',
          variant: 'destructive'
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      (window as any).speechRecognition = recognition;
    }
  }, []);

  const { data: products } = useQuery({
    queryKey: ['products-pos', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('is_active', true);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data;
    }
  });

  const createTransaction = useMutation({
    mutationFn: async (transactionData: any) => {
      // Generate transaction number
      const transactionNumber = `TRX-${Date.now()}`;
      
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          transaction_number: transactionNumber,
          customer_id: selectedCustomer?.id || null,
          cashier_id: user?.id,
          total_amount: transactionData.total_amount,
          discount_amount: transactionData.discount_amount,
          points_used: pointsToUse,
          points_earned: transactionData.points_earned,
          payment_type: paymentType,
          payment_amount: paymentAmount,
          change_amount: transactionData.change_amount,
          is_credit: paymentType === 'credit',
          paid_amount: paymentType === 'credit' ? 0 : paymentAmount
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update customer points if customer selected
      if (selectedCustomer && transactionData.points_earned > 0) {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            total_points: selectedCustomer.total_points + transactionData.points_earned - pointsToUse,
            total_spent: selectedCustomer.total_spent + transactionData.total_amount
          })
          .eq('id', selectedCustomer.id);

        if (customerError) throw customerError;

        // Create point transaction record
        await supabase.from('point_transactions').insert([{
          customer_id: selectedCustomer.id,
          transaction_id: transaction.id,
          points_change: transactionData.points_earned - pointsToUse,
          description: `Transaksi ${transactionNumber}`
        }]);
      }

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setCart([]);
      setSelectedCustomer(null);
      setPaymentAmount(0);
      setPointsToUse(0);
      setShowPayment(false);
      toast({ title: 'Berhasil', description: 'Transaksi berhasil disimpan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({
        title: 'Tidak Didukung',
        description: 'Browser tidak mendukung speech recognition',
        variant: 'destructive'
      });
      return;
    }

    setIsListening(true);
    (window as any).speechRecognition.start();
  };

  const getProductPrice = (product: any, quantity: number) => {
    if (product.tier3_quantity && quantity >= product.tier3_quantity) {
      return product.tier3_price;
    } else if (product.tier2_quantity && quantity >= product.tier2_quantity) {
      return product.tier2_price;
    } else if (product.tier1_quantity && quantity >= product.tier1_quantity) {
      return product.tier1_price;
    }
    return product.selling_price;
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const newPrice = getProductPrice(product, newQuantity);
      const updatedCart = cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: newQuantity, unit_price: newPrice, total_price: newPrice * newQuantity }
          : item
      );
      setCart(updatedCart);
    } else {
      const price = getProductPrice(product, 1);
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: price,
        total_price: price
      }]);
    }
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.product.id !== productId));
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        const newPrice = getProductPrice(item.product, newQuantity);
        return {
          ...item,
          quantity: newQuantity,
          unit_price: newPrice,
          total_price: newPrice * newQuantity
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total_price, 0);
  };

  const getPointsDiscount = () => {
    return pointsToUse; // 1 point = 1 rupiah
  };

  const getFinalTotal = () => {
    return getCartTotal() - getPointsDiscount();
  };

  const getPointsEarned = () => {
    return cart.reduce((total, item) => total + (item.product.loyalty_points * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Keranjang Kosong',
        description: 'Tambahkan produk ke keranjang terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    const finalTotal = getFinalTotal();
    
    if (paymentType !== 'credit' && paymentAmount < finalTotal) {
      toast({
        title: 'Pembayaran Kurang',
        description: 'Jumlah pembayaran kurang dari total belanja',
        variant: 'destructive'
      });
      return;
    }

    const transactionData = {
      total_amount: getCartTotal(),
      discount_amount: getPointsDiscount(),
      points_earned: getPointsEarned(),
      change_amount: paymentType === 'credit' ? 0 : paymentAmount - finalTotal
    };

    createTransaction.mutate(transactionData);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Point of Sale</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Checkout ({cart.length})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search & List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari produk atau scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleVoiceSearch}
                disabled={isListening}
                className={isListening ? 'bg-red-100' : ''}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'text-red-600' : ''}`} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {products?.map((product) => (
                <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4" onClick={() => addToCart(product)}>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">
                        {product.categories?.name} • Stok: {product.current_stock}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">
                          Rp {product.selling_price?.toLocaleString('id-ID')}
                        </span>
                        <Badge variant="secondary">
                          {product.loyalty_points} poin
                        </Badge>
                      </div>
                      {product.tier1_quantity && (
                        <div className="text-xs text-gray-500">
                          Grosir: {product.tier1_quantity}+ = Rp {product.tier1_price?.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang Belanja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label>Customer (Opsional)</Label>
                  <Select
                    value={selectedCustomer?.id || 'no-customer'}
                    onValueChange={(value) => {
                      if (value === 'no-customer') {
                        setSelectedCustomer(null);
                      } else {
                        const customer = customers?.find(c => c.id === value);
                        setSelectedCustomer(customer || null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-customer">Tidak ada customer</SelectItem>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.total_points} poin)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cart Items */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-600">
                            Rp {item.unit_price.toLocaleString('id-ID')} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.product.id, 0)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Rp {getCartTotal().toLocaleString('id-ID')}</span>
                      </div>
                      
                      {selectedCustomer && selectedCustomer.total_points > 0 && (
                        <div className="space-y-2">
                          <Label>Gunakan Poin ({selectedCustomer.total_points} tersedia)</Label>
                          <Input
                            type="number"
                            value={pointsToUse}
                            onChange={(e) => setPointsToUse(Math.min(Number(e.target.value), selectedCustomer.total_points, getCartTotal()))}
                            max={Math.min(selectedCustomer.total_points, getCartTotal())}
                          />
                          <div className="flex justify-between text-sm">
                            <span>Diskon poin:</span>
                            <span>-Rp {getPointsDiscount().toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>Rp {getFinalTotal().toLocaleString('id-ID')}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Poin yang didapat:</span>
                        <span>{getPointsEarned()} poin</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pembayaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Jenis Pembayaran</Label>
                <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="credit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentType !== 'credit' && (
                <div className="space-y-2">
                  <Label>Jumlah Bayar</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Belanja:</span>
                  <span>Rp {getFinalTotal().toLocaleString('id-ID')}</span>
                </div>
                {paymentType !== 'credit' && paymentAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span>Rp {Math.max(0, paymentAmount - getFinalTotal()).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPayment(false)}>
                  Batal
                </Button>
                <Button onClick={handleCheckout}>
                  Proses Pembayaran
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default POS;
