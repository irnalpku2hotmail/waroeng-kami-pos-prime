import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { generateReceiptHTML } from '@/utils/receiptGenerator';
import { extractReceiptSettings } from '@/utils/receiptSettingsHelper';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { buildSaleUnits, getBaseQuantity, getTierUnitPrice, type SaleUnit, type UnitDetails } from '@/lib/posSaleUnits';

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
  sale_unit_id: string;
  sale_unit_name: string;
  sale_unit_abbreviation: string;
  conversion_factor: number;
  sold_quantity: number;
  sale_unit_price: number;
  base_quantity: number;
  base_unit_id: string;
  base_unit_name: string;
  base_unit_abbreviation: string;
  sale_units: SaleUnit[];
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
  const [cart, setCartState] = useState<CartItem[]>([]);
  const cartRef = useRef<CartItem[]>(cart);
  cartRef.current = cart;
  const setCart = useCallback((next: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    const value = typeof next === 'function' ? (next as (p: CartItem[]) => CartItem[])(cartRef.current) : next;
    cartRef.current = value;
    setCartState(value);
  }, []);
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

  // Debounced so fast keystrokes (or a leaked scanner char) don't fire one query per char
  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  // Fetch products with stock and pricing info
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['pos-products', debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`*, categories(name), units(name, abbreviation), price_variants(*), unit_conversions(product_id, from_unit_id, to_unit_id, conversion_factor)`)
        .eq('is_active', true);
      
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,barcode.ilike.%${debouncedSearch}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: units = [] } = useQuery({
    queryKey: ['pos-sale-units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('id, name, abbreviation');
      if (error) throw error;
      return (data || []) as UnitDetails[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const conversionProductIds = Array.from(new Set([
    ...products.map((product: any) => product.id),
    ...cart.map((item) => item.product_id),
  ])).sort();
  const { data: unitConversions = [] } = useQuery({
    queryKey: ['pos-unit-conversions', conversionProductIds],
    queryFn: async () => {
      if (conversionProductIds.length === 0) return [];
      const { data, error } = await supabase
        .from('unit_conversions')
        .select('product_id, from_unit_id, to_unit_id, conversion_factor')
        .in('product_id', conversionProductIds);
      if (error) throw error;
      return data || [];
    },
    enabled: conversionProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent customers only (search is done server-side in CustomerSelector)
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'pos-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, total_points')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  const getProductUnitOptions = (product: any): { baseUnit: UnitDetails | null; options: SaleUnit[] } => {
    const nestedUnit = Array.isArray(product.units) ? product.units[0] : product.units;
    const baseUnitId = product.unit_id || nestedUnit?.id;
    const baseUnit = baseUnitId
      ? units.find((unit) => unit.id === baseUnitId) || (nestedUnit?.name ? {
          id: baseUnitId,
          name: nestedUnit.name,
          abbreviation: nestedUnit.abbreviation || '',
        } : null)
      : null;
    if (!baseUnit) return { baseUnit: null, options: [] };
    const cachedConversions = (product.unit_conversions || []).filter((conversion: any) => conversion.product_id === product.id);
    const fetchedConversions = unitConversions.filter((conversion: any) => conversion.product_id === product.id);
    const productConversions = fetchedConversions.length > 0 ? fetchedConversions : cachedConversions;
    const allUnits = units.length > 0 ? units : (nestedUnit?.name ? [{
      id: baseUnit.id,
      name: nestedUnit.name,
      abbreviation: nestedUnit.abbreviation || '',
    }] : []);
    return {
      baseUnit,
      options: buildSaleUnits(baseUnit, productConversions, allUnits),
    };
  };

  useEffect(() => {
    if (cart.length === 0) return;
    const refreshed = cart.map((item) => {
      const product = products.find((candidate: any) => candidate.id === item.product_id);
      if (!product) return item;
      const { baseUnit, options } = getProductUnitOptions(product);
      if (!baseUnit || options.length === 0) return item;
      const selectedUnit = options.find((option) => option.id === item.sale_unit_id);
      return {
        ...item,
        sale_unit_id: item.sale_unit_id || baseUnit.id,
        sale_unit_name: item.sale_unit_name || selectedUnit?.name || baseUnit.name,
        sale_unit_abbreviation: item.sale_unit_abbreviation || selectedUnit?.abbreviation || baseUnit.abbreviation,
        conversion_factor: item.conversion_factor || selectedUnit?.conversionFactor || 1,
        sold_quantity: item.sold_quantity || item.quantity,
        sale_unit_price: item.sale_unit_price || item.unit_price,
        base_quantity: item.base_quantity || getBaseQuantity(item.quantity, item.conversion_factor || 1) || item.quantity,
        base_unit_id: item.base_unit_id || baseUnit.id,
        base_unit_name: item.base_unit_name || baseUnit.name,
        base_unit_abbreviation: item.base_unit_abbreviation || baseUnit.abbreviation,
        sale_units: options,
      };
    });
    if (refreshed.some((item, index) => item !== cart[index])) setCart(refreshed);
  }, [products, units, unitConversions]);

  const getProductPrice = (product: any, baseQuantity: number) => {
    const price = getTierUnitPrice(product, baseQuantity);
    const variant = (product.price_variants || [])
      .filter((item: any) => item.is_active && baseQuantity >= item.minimum_quantity)
      .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity)[0] || null;
    return { price, variant };
  };

  const getAvailableBaseStock = (productId: string) => {
    const product = products.find((item: any) => item.id === productId);
    return Number(product?.current_stock ?? cart.find((item) => item.product_id === productId)?.current_stock ?? 0);
  };

  const getOtherCartBaseQuantity = (productId: string, exceptLineId?: string) =>
    cart.reduce((sum, item) => sum + (
      item.product_id === productId && item.id !== exceptLineId
        ? (item.base_quantity ?? getBaseQuantity(item.quantity, item.conversion_factor) ?? item.quantity)
        : 0
    ), 0);

  const repriceProductLines = (nextCart: CartItem[], productId: string, product: any) => {
    const aggregateBaseQuantity = nextCart.reduce((sum, item) => sum + (
      item.product_id === productId
        ? (item.base_quantity ?? getBaseQuantity(item.quantity, item.conversion_factor) ?? item.quantity)
        : 0
    ), 0);
    const priceInfo = getProductPrice(product, aggregateBaseQuantity);
    return nextCart.map((item) => {
      if (item.product_id !== productId) return item;
      const baseQuantity = item.base_quantity ?? getBaseQuantity(item.quantity, item.conversion_factor) ?? item.quantity;
      const saleUnitPrice = priceInfo.price * item.conversion_factor;
      return {
        ...item,
        base_quantity: baseQuantity,
        unit_price: priceInfo.price,
        sale_unit_price: saleUnitPrice,
        total_price: item.quantity * saleUnitPrice,
        price_variant: priceInfo.variant,
      };
    });
  };

  const addToCart = (product: any, quantity: number = 1, opts?: { silent?: boolean }): boolean => {
    // Use latest cart (ref) so rapid consecutive scans never lose increments
    const cart = cartRef.current;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;
    const availableStock = getAvailableBaseStock(product.id) || Number(product.current_stock || 0);
    const { baseUnit, options } = getProductUnitOptions(product);
    if (!baseUnit || options.length === 0) {
      toast({ title: 'Satuan dasar tidak tersedia', description: `Atur satuan dasar untuk ${product.name} di data produk.`, variant: 'destructive' });
      return false;
    }

    const baseOption = options.find((option) => option.id === baseUnit.id);
    if (!baseOption) return false;
    const existingItem = cart.find(item => item.product_id === product.id && item.sale_unit_id === baseUnit.id);
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    const newBaseQuantity = getBaseQuantity(newQuantity, baseOption.conversionFactor);
    if (newBaseQuantity === null || getOtherCartBaseQuantity(product.id, existingItem?.id) + newBaseQuantity > availableStock) {
      toast({ title: 'Stok Tidak Mencukupi', description: `Stok tersedia: ${availableStock} ${baseUnit.abbreviation}.`, variant: 'destructive' });
      return false;
    }

    const baseUnitPriceInfo = getProductPrice(product, getOtherCartBaseQuantity(product.id, existingItem?.id) + newBaseQuantity);
    if (existingItem) {
      const updated = cart.map(item => item.id === existingItem.id
        ? { ...item, quantity: newQuantity, sold_quantity: newQuantity, base_quantity: newBaseQuantity }
        : item);
      setCart(repriceProductLines(updated, product.id, product));
    } else {
      const cartItem: CartItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        quantity: quantity,
        unit_price: baseUnitPriceInfo.price,
        total_price: quantity * baseUnitPriceInfo.price,
        current_stock: availableStock,
        price_variant: baseUnitPriceInfo.variant,
        loyalty_points: product.loyalty_points || 1,
        sale_unit_id: baseUnit.id,
        sale_unit_name: baseUnit.name,
        sale_unit_abbreviation: baseUnit.abbreviation,
        conversion_factor: 1,
        sold_quantity: quantity,
        sale_unit_price: baseUnitPriceInfo.price,
        base_quantity: quantity,
        base_unit_id: baseUnit.id,
        base_unit_name: baseUnit.name,
        base_unit_abbreviation: baseUnit.abbreviation,
        sale_units: options,
      };
      const updated = [...cart, cartItem];
      setCart(repriceProductLines(updated, product.id, product));
    }

    if (!opts?.silent) toast({ 
      title: 'Produk Ditambahkan', 
      description: `${quantity}x ${product.name} ditambahkan ke keranjang`,
      duration: 2000 
    });
    return true;
  };

  const updateCartQuantity = (lineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(lineId);
      return;
    }

    if (!Number.isSafeInteger(newQuantity)) return;
    const cartItem = cart.find(item => item.id === lineId);
    if (!cartItem) return;

    const baseQuantity = getBaseQuantity(newQuantity, cartItem.conversion_factor);
    if (baseQuantity === null) {
      toast({ title: 'Jumlah tidak sesuai', description: `Jumlah harus menghasilkan bilangan ${cartItem.base_unit_name}.`, variant: 'destructive' });
      return;
    }
    const availableStock = getAvailableBaseStock(cartItem.product_id);
    if (getOtherCartBaseQuantity(cartItem.product_id, lineId) + baseQuantity > availableStock) {
      toast({ title: 'Stok Tidak Mencukupi', description: `Stok tersedia: ${availableStock} ${cartItem.base_unit_abbreviation}.`, variant: 'destructive' });
      return;
    }
    const product = products.find((item: any) => item.id === cartItem.product_id) || {
      selling_price: cartItem.unit_price,
      price_variants: cartItem.price_variant ? [cartItem.price_variant] : [],
    };
    const updated = cart.map((item) => item.id === lineId
      ? { ...item, quantity: newQuantity, sold_quantity: newQuantity, base_quantity: baseQuantity }
      : item);
    setCart(repriceProductLines(updated, cartItem.product_id, product));
  };

  const updateCartItemUnit = (lineId: string, unitId: string) => {
    const cartItem = cart.find((item) => item.id === lineId);
    if (!cartItem) return;
    const product = products.find((item: any) => item.id === cartItem.product_id);
    const options = product ? getProductUnitOptions(product).options : cartItem.sale_units;
    const option = options.find((unit) => unit.id === unitId);
    if (!option) return;
    const baseQuantity = getBaseQuantity(cartItem.quantity, option.conversionFactor);
    if (baseQuantity === null) {
      toast({ title: 'Jumlah tidak sesuai', description: `Pilih jumlah yang menghasilkan bilangan ${cartItem.base_unit_name}.`, variant: 'destructive' });
      return;
    }
    const availableStock = getAvailableBaseStock(cartItem.product_id);
    if (getOtherCartBaseQuantity(cartItem.product_id, lineId) + baseQuantity > availableStock) {
      toast({ title: 'Stok Tidak Mencukupi', description: `Stok tersedia: ${availableStock} ${cartItem.base_unit_abbreviation}.`, variant: 'destructive' });
      return;
    }
    const updated = cart.map((item) => item.id === lineId
      ? {
          ...item,
          sale_unit_id: option.id,
          sale_unit_name: option.name,
          sale_unit_abbreviation: option.abbreviation,
          conversion_factor: option.conversionFactor,
          sold_quantity: item.quantity,
          sale_units: options,
          base_quantity: baseQuantity,
        }
      : item);
    const pricingProduct = product || { selling_price: cartItem.unit_price, price_variants: [] };
    setCart(repriceProductLines(updated, cartItem.product_id, pricingProduct));
  };

  const removeFromCart = (lineId: string) => {
    const removed = cart.find((item) => item.id === lineId);
    const updated = cart.filter(item => item.id !== lineId);
    if (!removed) {
      setCart(updated);
      return;
    }
    const product = products.find((item: any) => item.id === removed.product_id);
    if (product && updated.some((item) => item.product_id === removed.product_id)) {
      setCart(repriceProductLines(updated, removed.product_id, product));
    } else {
      setCart(updated);
    }
  };

  const getTotalAmount = () => cart.reduce((total, item) => total + item.total_price, 0);
  const getTotalPointsEarned = () => cart.reduce((total, item) => total + (item.loyalty_points * (item.base_quantity ?? item.quantity)), 0);
  const getChangeAmount = () => Math.max(0, paymentAmount - getTotalAmount());

  const printReceipt = async (transaction: any) => {
    try {
      // Fetch latest settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('key, value');
      
      const settingsMap = settingsData?.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {}) || {};

      // Use helper to extract receipt settings consistently
      const receiptSettings = extractReceiptSettings(settingsMap);

      const receiptData = {
        transaction_number: transaction.transaction_number,
        transaction_date: transaction.created_at,
        customer_name: selectedCustomer?.name,
        cashier_name: user?.email || 'Admin',
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.sale_unit_price ?? item.unit_price,
          unit_name: item.sale_unit_name,
          unit_abbreviation: item.sale_unit_abbreviation,
          total_price: item.total_price,
        })),
        subtotal: getTotalAmount(),
        total: getTotalAmount(),
        paid_amount: paymentType === 'cash' ? paymentAmount : getTotalAmount(),
        change_amount: paymentType === 'cash' ? getChangeAmount() : undefined,
        payment_method: paymentType === 'cash' ? 'Tunai' : paymentType === 'credit' ? 'Kredit' : 'Transfer',
        points_earned: selectedCustomer && getTotalPointsEarned() > 0 ? getTotalPointsEarned() : undefined,
        notes: paymentType === 'transfer' ? `Ref: ${transferReference}` : undefined,
      };

      const receiptContent = generateReceiptHTML(receiptData, receiptSettings);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        
        printWindow.onload = function() {
          printWindow.print();
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

      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        quantity: item.base_quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sold_quantity: item.sold_quantity,
        sale_unit_id: item.sale_unit_id,
        sale_unit_name: item.sale_unit_name,
        sale_unit_abbreviation: item.sale_unit_abbreviation,
        conversion_factor: item.conversion_factor,
        sale_unit_price: item.sale_unit_price,
      }));
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
      queryClient.invalidateQueries({ queryKey: ['customer-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['customer-summary'] });
      queryClient.invalidateQueries({ queryKey: ['customer-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-transaction-years'] });
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
    updateCartItemUnit,
    removeFromCart,
    getTotalAmount,
    getTotalPointsEarned,
    getChangeAmount,
    processTransaction,
    handleVoiceSearch,
    printReceipt,
  };
};
