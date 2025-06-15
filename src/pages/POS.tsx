import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, DollarSign, Printer } from 'lucide-react';
import Layout from '@/components/Layout';
import VoiceSearch from '@/components/VoiceSearch';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  current_stock: number;
  price_variant?: any;
  loyalty_points: number;
}

const POS = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'transfer'>('cash');
  const [transferReference, setTransferReference] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  // Fetch products with stock and pricing info
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['pos-products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation),
          price_variants(*)
        `)
        .eq('is_active', true);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const getProductPrice = (product: any, quantity: number) => {
    // Check for price variants based on quantity
    if (product.price_variants?.length > 0) {
      const applicableVariants = product.price_variants
        .filter((pv: any) => pv.is_active && quantity >= pv.minimum_quantity)
        .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity);
      
      if (applicableVariants.length > 0) {
        return {
          price: applicableVariants[0].price,
          variant: applicableVariants[0]
        };
      }
    }
    
    return {
      price: product.selling_price,
      variant: null
    };
  };

  const addToCart = (product: any, quantity: number = 1) => {
    // Check stock availability
    if (product.current_stock < quantity) {
      toast({
        title: 'Stok Tidak Mencukupi',
        description: `Stok tersedia: ${product.current_stock}`,
        variant: 'destructive'
      });
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    
    // Check total quantity against stock
    if (product.current_stock < newQuantity) {
      toast({
        title: 'Stok Tidak Mencukupi',
        description: `Maksimal yang bisa ditambahkan: ${product.current_stock - (existingItem?.quantity || 0)}`,
        variant: 'destructive'
      });
      return;
    }

    const priceInfo = getProductPrice(product, newQuantity);

    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? {
              ...item,
              quantity: newQuantity,
              unit_price: priceInfo.price,
              total_price: newQuantity * priceInfo.price,
              price_variant: priceInfo.variant,
              loyalty_points: product.loyalty_points || 1
            }
          : item
      ));
    } else {
      const cartItem: CartItem = {
        id: Date.now().toString(),
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        quantity: quantity,
        unit_price: priceInfo.price,
        total_price: quantity * priceInfo.price,
        current_stock: product.current_stock,
        price_variant: priceInfo.variant,
        loyalty_points: product.loyalty_points || 1
      };
      setCart([...cart, cartItem]);
    }

    setShowProductDialog(false);
    toast({ 
      title: 'Produk Ditambahkan', 
      description: `${product.name} ditambahkan ke keranjang` 
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const cartItem = cart.find(item => item.product_id === productId);
    if (!cartItem) return;

    // Check stock
    if (cartItem.current_stock < newQuantity) {
      toast({
        title: 'Stok Tidak Mencukupi',
        description: `Stok tersedia: ${cartItem.current_stock}`,
        variant: 'destructive'
      });
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const priceInfo = getProductPrice(product, newQuantity);

    setCart(cart.map(item => 
      item.product_id === productId 
        ? {
            ...item,
            quantity: newQuantity,
            unit_price: priceInfo.price,
            total_price: newQuantity * priceInfo.price,
            price_variant: priceInfo.variant
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total_price, 0);
  };

  const getTotalPointsEarned = () => {
    return cart.reduce((total, item) => total + (item.loyalty_points * item.quantity), 0);
  };

  const getChangeAmount = () => {
    return Math.max(0, paymentAmount - getTotalAmount());
  };

  // Generate transfer reference number
  const generateTransferReference = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TRF${timestamp}${random}`;
  };

  // Print receipt
  const printReceipt = async (transaction: any) => {
    try {
      const storeName = settings?.store_name?.name || 'SmartPOS';
      const storePhone = settings?.store_phone?.phone || '';
      const storeAddress = settings?.store_address?.address || '';
      const receiptSettings = settings?.receipt_settings || {};
      const receiptHeader = receiptSettings.header_text || 'Terima kasih telah berbelanja';
      const receiptFooter = receiptSettings.footer_text || 'Barang yang sudah dibeli tidak dapat dikembalikan';
      const showQrCode = receiptSettings.show_qr_code !== false; // Default true

      // Generate QR code URL for transaction number
      const qrCodeUrl = showQrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${transaction.transaction_number}` : '';

      const receiptContent = `
========================================
           ${storeName}
========================================
${storePhone ? `Tel: ${storePhone}` : ''}
${storeAddress ? `${storeAddress}` : ''}
========================================
${receiptHeader}
========================================
Transaction: ${transaction.transaction_number}
Date: ${new Date().toLocaleString('id-ID')}
Cashier: ${user?.email}
${selectedCustomer ? `Customer: ${selectedCustomer.name}` : ''}
----------------------------------------
${cart.map(item => `
${item.name}
${item.quantity} x Rp ${item.unit_price.toLocaleString('id-ID')}
                    Rp ${item.total_price.toLocaleString('id-ID')}
`).join('')}
----------------------------------------
Total: Rp ${getTotalAmount().toLocaleString('id-ID')}
Payment: ${paymentType === 'cash' ? 'Cash' : paymentType === 'credit' ? 'Credit' : 'Transfer'}
${paymentType === 'cash' ? `Paid: Rp ${paymentAmount.toLocaleString('id-ID')}` : ''}
${paymentType === 'cash' ? `Change: Rp ${getChangeAmount().toLocaleString('id-ID')}` : ''}
${paymentType === 'transfer' ? `Ref: ${transferReference}` : ''}
${selectedCustomer ? `Points Earned: ${getTotalPointsEarned()}` : ''}
${paymentType === 'credit' ? `Due Date: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}` : ''}
========================================
${receiptFooter}
========================================
      `;

      if (window.print) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Receipt</title>
                <style>
                  body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; text-align: center; }
                  pre { white-space: pre-wrap; margin: 0; }
                  .qr-code { margin: 10px 0; }
                </style>
              </head>
              <body>
                <pre>${receiptContent}</pre>
                ${showQrCode ? `<div class="qr-code"><img src="${qrCodeUrl}" alt="QR Code" /></div>` : ''}
                <script>
                  window.onload = function() {
                    window.print();
                    window.close();
                  }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Printing error:', error);
      toast({
        title: 'Printing Error',
        description: 'Unable to print receipt',
        variant: 'destructive'
      });
    }
  };

  // Process transaction
  const processTransaction = useMutation({
    mutationFn: async () => {
      const totalAmount = getTotalAmount();
      
      if (paymentType === 'cash' && paymentAmount < totalAmount) {
        throw new Error('Pembayaran tidak mencukupi');
      }

      if (paymentType === 'transfer' && !transferReference) {
        throw new Error('Nomor referensi transfer harus diisi');
      }

      const transactionNumber = `TRX${Date.now()}`;
      const pointsEarned = selectedCustomer ? getTotalPointsEarned() : 0;

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          total_amount: totalAmount,
          cashier_id: user?.id,
          customer_id: selectedCustomer?.id,
          payment_type: paymentType,
          payment_amount: paymentType === 'cash' ? paymentAmount : totalAmount,
          change_amount: paymentType === 'cash' ? getChangeAmount() : 0,
          is_credit: paymentType === 'credit',
          points_earned: pointsEarned,
          due_date: paymentType === 'credit' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
          notes: paymentType === 'transfer' ? `Transfer Ref: ${transferReference}` : null
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update customer points if applicable
      if (selectedCustomer && pointsEarned > 0) {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            total_points: selectedCustomer.total_points + pointsEarned,
            total_spent: (selectedCustomer.total_spent || 0) + totalAmount
          })
          .eq('id', selectedCustomer.id);

        if (customerError) throw customerError;

        await supabase
          .from('point_transactions')
          .insert({
            customer_id: selectedCustomer.id,
            transaction_id: transaction.id,
            points_change: pointsEarned,
            description: `Pembelian ${transactionNumber}`
          });
      }

      return transaction;
    },
    onSuccess: (transaction) => {
      toast({ 
        title: 'Transaksi Berhasil', 
        description: `Transaksi ${transaction.transaction_number} berhasil diproses` 
      });
      
      // Automatic thermal printing
      printReceipt(transaction);
      
      // Reset form
      setCart([]);
      setSelectedCustomer(null);
      setPaymentAmount(0);
      setPaymentType('cash');
      setTransferReference('');
      
      // Refresh products to update stock
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Handle voice search
  const handleVoiceSearch = (text: string) => {
    console.log('Voice search result:', text);
    
    // Find product by name (case insensitive)
    const foundProduct = products.find(product => 
      product.name.toLowerCase().includes(text.toLowerCase()) ||
      (product.barcode && product.barcode.includes(text))
    );

    if (foundProduct) {
      addToCart(foundProduct, 1);
      toast({
        title: 'Produk Ditemukan',
        description: `${foundProduct.name} ditambahkan ke keranjang melalui voice search`
      });
    } else {
      setSearchTerm(text);
      toast({
        title: 'Produk Tidak Ditemukan',
        description: `Mencari produk: ${text}`
      });
    }
  };

  // Open product dialog
  const openProductDialog = (product: any) => {
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  // Get image URL
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  // Clear transfer reference when payment type changes
  useEffect(() => {
    if (paymentType === 'transfer') {
      setTransferReference('');
    }
  }, [paymentType]);

  return (
    <Layout>
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Products Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari produk atau scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <VoiceSearch onVoiceResult={handleVoiceSearch} />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(100vh-220px)] overflow-y-auto">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading...</div>
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              products.map((product) => {
                const productImageUrl = getImageUrl(product.image_url);
                return (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openProductDialog(product)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square mb-2 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {productImageUrl ? (
                          <img 
                            src={productImageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <h3 className="font-medium text-sm truncate">{product.name}</h3>
                      <p className="text-lg font-bold text-green-600">
                        Rp {product.selling_price?.toLocaleString('id-ID')}
                      </p>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>Stok: {product.current_stock}</span>
                        <span>{product.loyalty_points || 1} pts</span>
                      </div>
                      {product.price_variants?.length > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Grosir
                        </Badge>
                      )}
                      {product.current_stock <= 0 && (
                        <Badge variant="destructive" className="w-full mt-1">
                          Habis
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="text-sm font-medium">Customer (Opsional)</label>
                <Select value={selectedCustomer?.id || 'no-customer'} onValueChange={(value) => {
                  if (value === 'no-customer') {
                    setSelectedCustomer(null);
                  } else {
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-customer">Tanpa Customer</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.total_points} pts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cart Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
                ) : (
                  cart.map((item) => {
                    const itemImageUrl = getImageUrl(item.image_url);
                    return (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                        {itemImageUrl && (
                          <img src={itemImageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Rp {item.unit_price.toLocaleString('id-ID')} | {item.loyalty_points}pts
                            {item.price_variant && (
                              <span className="ml-1 text-blue-600">({item.price_variant.name})</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 w-6 p-0"
                            onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 w-6 p-0"
                            onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-6 w-6 p-0 ml-1"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Payment */}
              {cart.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">Rp {getTotalAmount().toLocaleString('id-ID')}</span>
                    </div>
                    {selectedCustomer && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Poin yang didapat:</span>
                        <span>{getTotalPointsEarned()} pts</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Metode Pembayaran</label>
                    <Select value={paymentType} onValueChange={(value: 'cash' | 'credit' | 'transfer') => setPaymentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit">Credit (7 Hari)</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentType === 'cash' && (
                    <div>
                      <label className="text-sm font-medium">Jumlah Bayar</label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        placeholder="Masukkan jumlah bayar"
                      />
                      {paymentAmount > 0 && (
                        <div className="flex justify-between mt-2 text-sm">
                          <span>Kembalian:</span>
                          <span className="font-bold">Rp {getChangeAmount().toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentType === 'transfer' && (
                    <div>
                      <label className="text-sm font-medium">Nomor Referensi</label>
                      <Input
                        type="text"
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        placeholder="Masukkan nomor referensi transfer"
                      />
                    </div>
                  )}

                  {paymentType === 'credit' && (
                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      Jatuh tempo: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => processTransaction.mutate()}
                    disabled={
                      cart.length === 0 || 
                      (paymentType === 'cash' && paymentAmount < getTotalAmount()) ||
                      (paymentType === 'transfer' && !transferReference) ||
                      processTransaction.isPending
                    }
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {processTransaction.isPending ? 'Memproses...' : 'Proses Transaksi'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Produk</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.image_url && (
                <img 
                  src={getImageUrl(selectedProduct.image_url) || undefined} 
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                <p className="text-gray-600">{selectedProduct.description}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  Rp {selectedProduct.selling_price?.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-500">Stok: {selectedProduct.current_stock}</p>
                <p className="text-sm text-blue-500">Loyalty Points: {selectedProduct.loyalty_points || 1}</p>
              </div>

              {selectedProduct.price_variants?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Harga Grosir:</h4>
                  <div className="space-y-1">
                    {selectedProduct.price_variants
                      .filter((pv: any) => pv.is_active)
                      .sort((a: any, b: any) => a.minimum_quantity - b.minimum_quantity)
                      .map((variant: any) => (
                        <div key={variant.id} className="flex justify-between text-sm">
                          <span>Min {variant.minimum_quantity} pcs</span>
                          <span className="font-medium">Rp {variant.price.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => addToCart(selectedProduct, 1)}
                  disabled={selectedProduct.current_stock <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah ke Keranjang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default POS;
