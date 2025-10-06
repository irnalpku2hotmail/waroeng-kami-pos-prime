import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
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

export const getImageUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(imageUrl);
  
  return data.publicUrl;
};

export const usePOS = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'transfer'>('cash');
  const [transferReference, setTransferReference] = useState('');
  const queryClient = useQueryClient();

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
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
        .select(`*, categories(name), units(name, abbreviation), price_variants(*)`)
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
        .select('id, name, email, phone, total_points')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const getProductPrice = (product: any, quantity: number) => {
    if (product.price_variants?.length > 0) {
      const applicableVariants = product.price_variants
        .filter((pv: any) => pv.is_active && quantity >= pv.minimum_quantity)
        .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity);
      
      if (applicableVariants.length > 0) {
        return { price: applicableVariants[0].price, variant: applicableVariants[0] };
      }
    }
    return { price: product.selling_price, variant: null };
  };

  const addToCart = (product: any, quantity: number = 1) => {
    if (product.current_stock < quantity) {
      toast({ title: 'Stok Tidak Mencukupi', description: `Stok tersedia: ${product.current_stock}`, variant: 'destructive' });
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    
    if (product.current_stock < newQuantity) {
      toast({ title: 'Stok Tidak Mencukupi', description: `Maksimal yang bisa ditambahkan: ${product.current_stock - (existingItem?.quantity || 0)}`, variant: 'destructive' });
      return;
    }

    const priceInfo = getProductPrice(product, newQuantity);

    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: newQuantity, unit_price: priceInfo.price, total_price: newQuantity * priceInfo.price, price_variant: priceInfo.variant, loyalty_points: product.loyalty_points || 1 }
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

    toast({ 
      title: 'Produk Ditambahkan', 
      description: `${quantity}x ${product.name} ditambahkan ke keranjang`,
      duration: 2000 
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const cartItem = cart.find(item => item.product_id === productId);
    if (!cartItem) return;

    if (cartItem.current_stock < newQuantity) {
      toast({ title: 'Stok Tidak Mencukupi', description: `Stok tersedia: ${cartItem.current_stock}`, variant: 'destructive' });
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const priceInfo = getProductPrice(product, newQuantity);

    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity, unit_price: priceInfo.price, total_price: newQuantity * priceInfo.price, price_variant: priceInfo.variant }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const getTotalAmount = () => cart.reduce((total, item) => total + item.total_price, 0);
  const getTotalPointsEarned = () => cart.reduce((total, item) => total + (item.loyalty_points * item.quantity), 0);
  const getChangeAmount = () => Math.max(0, paymentAmount - getTotalAmount());

  const printReceipt = async (transaction: any) => {
    try {
      // Get settings from the receipt settings tab
      const receiptWidth = settings?.receipt_width?.value || '80mm';
      const storeName = settings?.store_name?.value || 'SmartPOS';
      const storePhone = settings?.store_phone?.value || '';
      const storeAddress = settings?.store_address?.value || '';
      const receiptFooter = settings?.receipt_footer?.value || 'Terima Kasih!';

      const receiptContent = `
        <html>
          <head>
            <title>Receipt</title>
            <style>
              @media print {
                body { margin: 0; padding: 10px; font-family: monospace; font-size: 12px; }
                .receipt { width: ${receiptWidth}; }
                table { width: 100%; border-collapse: collapse; }
                th, td { text-align: left; padding: 2px 0; }
                .center { text-align: center; }
                .right { text-align: right; }
                .border-top { border-top: 1px dashed #000; margin: 5px 0; }
                @page { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="center">
                <h2 style="margin: 0;">${storeName}</h2>
                <p style="margin: 2px 0;">${storeAddress}</p>
                <p style="margin: 2px 0;">Telp: ${storePhone}</p>
              </div>
              <div class="border-top"></div>
              <p>No: ${transaction.transaction_number}</p>
              <p>Tanggal: ${new Date(transaction.created_at).toLocaleString('id-ID')}</p>
              <p>Kasir: ${user?.email || 'Admin'}</p>
              ${selectedCustomer ? `<p>Pelanggan: ${selectedCustomer.name}</p>` : ''}
              <div class="border-top"></div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="center">Qty</th>
                    <th class="right">Harga</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${cart.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td class="center">${item.quantity}</td>
                      <td class="right">${new Intl.NumberFormat('id-ID').format(item.unit_price)}</td>
                      <td class="right">${new Intl.NumberFormat('id-ID').format(item.total_price)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="border-top"></div>
              <table>
                <tr>
                  <td><strong>Total:</strong></td>
                  <td class="right"><strong>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(getTotalAmount())}</strong></td>
                </tr>
                <tr>
                  <td>Bayar:</td>
                  <td class="right">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(paymentAmount)}</td>
                </tr>
                ${paymentType === 'cash' ? `
                <tr>
                  <td>Kembali:</td>
                  <td class="right">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(getChangeAmount())}</td>
                </tr>
                ` : ''}
                ${paymentType === 'transfer' ? `
                <tr>
                  <td>Ref Transfer:</td>
                  <td class="right">${transferReference}</td>
                </tr>
                ` : ''}
                ${selectedCustomer && getTotalPointsEarned() > 0 ? `
                <tr>
                  <td>Poin Didapat:</td>
                  <td class="right">${getTotalPointsEarned()} poin</td>
                </tr>
                ` : ''}
              </table>
              <div class="border-top"></div>
              <p class="center">${receiptFooter}</p>
              <p class="center">Selamat Berbelanja Kembali</p>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        
        // Auto print after content loaded
        printWindow.onload = function() {
          printWindow.print();
          // Close window after printing
          setTimeout(() => {
            printWindow.close();
          }, 500);
        };
      }
    } catch (error) {
      console.error('Printing error:', error);
      toast({ title: 'Error Mencetak', description: 'Gagal mencetak struk', variant: 'destructive' });
    }
  };

  const processTransaction = useMutation({
    mutationFn: async () => {
      const totalAmount = getTotalAmount();
      
      if (paymentType === 'cash' && paymentAmount < totalAmount) throw new Error('Pembayaran tidak mencukupi');
      if (paymentType === 'transfer' && !transferReference) throw new Error('Nomor referensi transfer harus diisi');

      const transactionNumber = `TRX${Date.now()}`;
      const pointsEarned = selectedCustomer ? getTotalPointsEarned() : 0;

      // Insert transaction - customer_id can be null
      const { data: transaction, error: transactionError } = await supabase.from('transactions').insert({
        transaction_number: transactionNumber,
        total_amount: totalAmount,
        cashier_id: user?.id || null,
        customer_id: selectedCustomer?.id || null,
        payment_type: paymentType,
        payment_amount: paymentType === 'cash' ? paymentAmount : totalAmount,
        change_amount: paymentType === 'cash' ? getChangeAmount() : 0,
        is_credit: paymentType === 'credit',
        points_earned: pointsEarned,
        due_date: paymentType === 'credit' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        notes: paymentType === 'transfer' ? `Transfer Ref: ${transferReference}` : null
      }).select().single();

      if (transactionError) throw transactionError;

      const transactionItems = cart.map(item => ({ transaction_id: transaction.id, product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price, total_price: item.total_price }));
      const { error: itemsError } = await supabase.from('transaction_items').insert(transactionItems);
      if (itemsError) throw itemsError;

      // Only update customer if one was selected
      if (selectedCustomer && pointsEarned > 0) {
        const { error: customerError } = await supabase.from('customers').update({ total_points: selectedCustomer.total_points + pointsEarned, total_spent: (selectedCustomer.total_spent || 0) + totalAmount }).eq('id', selectedCustomer.id);
        if (customerError) throw customerError;
        await supabase.from('point_transactions').insert({ customer_id: selectedCustomer.id, transaction_id: transaction.id, points_change: pointsEarned, description: `Pembelian ${transactionNumber}` });
      }
      return transaction;
    },
    onSuccess: (transaction) => {
      toast({ title: 'Transaksi Berhasil', description: `Transaksi ${transaction.transaction_number} berhasil diproses` });
      printReceipt(transaction);
      setCart([]);
      setSelectedCustomer(null);
      setPaymentAmount(0);
      setPaymentType('cash');
      setTransferReference('');
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleVoiceSearch = (text: string) => {
    console.log('Handling voice search:', text);
    
    // Import parser function
    const parseVoiceCommand = (text: string) => {
      const cleanText = text.toLowerCase().trim();
      let quantity = 1;
      let productName = cleanText;

      // Check for numeric digits at the start
      const words = cleanText.split(' ');
      const firstWord = words[0];
      const numericMatch = firstWord.match(/^(\d+)/);
      
      if (numericMatch) {
        quantity = parseInt(numericMatch[1]);
        productName = words.slice(1).join(' ').trim();
      } else {
        // Check for number words in Indonesian
        const numberWords: Record<string, number> = {
          'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
          'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
          'sebelas': 11, 'dua belas': 12, 'tiga belas': 13, 'empat belas': 14, 'lima belas': 15,
          'enam belas': 16, 'tujuh belas': 17, 'delapan belas': 18, 'sembilan belas': 19,
          'dua puluh': 20, 'tiga puluh': 30, 'empat puluh': 40, 'lima puluh': 50
        };
        
        // Check single word numbers
        if (numberWords[firstWord]) {
          quantity = numberWords[firstWord];
          productName = words.slice(1).join(' ').trim();
        } else if (words.length >= 2) {
          // Check two-word numbers
          const twoWordNumber = `${words[0]} ${words[1]}`;
          if (numberWords[twoWordNumber]) {
            quantity = numberWords[twoWordNumber];
            productName = words.slice(2).join(' ').trim();
          }
        }
      }

      // Clean up product name
      productName = productName
        .replace(/^(beli|ambil|tambah|mau|ingin)\s+/i, '')
        .replace(/\s+(dong|ya|aja|saja)$/i, '')
        .trim();

      return { quantity: Math.max(1, quantity), productName, originalText: text };
    };

    const findBestProductMatch = (productName: string, products: any[]) => {
      const cleanInput = productName.toLowerCase().trim();
      
      // Direct name match
      let bestMatch = products.find(product => 
        product.name.toLowerCase() === cleanInput
      );
      
      if (bestMatch) return bestMatch;
      
      // Partial name match
      bestMatch = products.find(product => 
        product.name.toLowerCase().includes(cleanInput) || 
        cleanInput.includes(product.name.toLowerCase())
      );
      
      if (bestMatch) return bestMatch;
      
      // Barcode match
      bestMatch = products.find(product => 
        product.barcode && product.barcode.includes(cleanInput)
      );
      
      return bestMatch || null;
    };

    const parsed = parseVoiceCommand(text);
    console.log('Parsed voice command:', parsed);
    
    const foundProduct = findBestProductMatch(parsed.productName, products || []);
    
    if (foundProduct) {
      // Check stock availability
      if (foundProduct.current_stock < parsed.quantity) {
        toast({ 
          title: 'Stok Tidak Mencukupi', 
          description: `${foundProduct.name} - Stok tersedia: ${foundProduct.current_stock}, diminta: ${parsed.quantity}`,
          variant: 'destructive',
          duration: 3000
        });
        return;
      }
      
      addToCart(foundProduct, parsed.quantity);
      toast({ 
        title: 'Produk Ditemukan', 
        description: `${parsed.quantity}x ${foundProduct.name} ditambahkan ke keranjang`,
        duration: 3000
      });
    } else {
      // If no product found, set search term for manual search
      setSearchTerm(parsed.productName);
      toast({ 
        title: 'Produk Tidak Ditemukan', 
        description: `Mencari: "${parsed.productName}"${parsed.quantity > 1 ? ` (${parsed.quantity}x)` : ''}`,
        variant: 'default',
        duration: 3000
      });
    }
  };

  useEffect(() => {
    if (paymentType !== 'transfer') {
      setTransferReference('');
    }
  }, [paymentType]);

  return {
    user,
    searchTerm,
    setSearchTerm,
    cart,
    setCart,
    selectedCustomer,
    setSelectedCustomer,
    paymentAmount,
    setPaymentAmount,
    paymentType,
    setPaymentType,
    transferReference,
    setTransferReference,
    settings,
    products,
    isLoading,
    customers,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getTotalAmount,
    getTotalPointsEarned,
    getChangeAmount,
    processTransaction,
    handleVoiceSearch,
    printReceipt,
  };
};
