
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 8;

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
  loyalty_points: number;
  price_variant?: {
    id: string;
    name: string;
    price: number;
    minimum_quantity: number;
  };
}

export const getImageUrl = (imageUrl?: string) => {
  return imageUrl || null;
};

export const usePOS = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'transfer'>('cash');
  const [transferReference, setTransferReference] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['pos-products', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('products')
        .select(`
          *,
          price_variants(*)
        `, { count: 'exact' })
        .eq('is_active', true)
        .gt('current_stock', 0);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data, count };
    }
  });

  const products = productsData?.data || [];
  const productsCount = productsData?.count || 0;
  const totalPages = Math.ceil(productsCount / ITEMS_PER_PAGE);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const processTransaction = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) {
        throw new Error('Keranjang belanja kosong');
      }

      const transactionNumber = `POS-${new Date().getTime()}`;
      const transactionData = {
        transaction_number: transactionNumber,
        customer_id: selectedCustomer?.id || null,
        total_amount: getTotalAmount(),
        discount_amount: discountAmount,
        points_used: pointsUsed,
        payment_amount: paymentAmount,
        cashier_id: user?.id,
        payment_type: paymentType,
        change_amount: getChangeAmount(),
        points_earned: getTotalPointsEarned(),
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      const transactionId = transaction.id;

      const cartItemsData = cart.map(item => ({
        transaction_id: transactionId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: cartItemsError } = await supabase
        .from('transaction_items')
        .insert(cartItemsData);

      if (cartItemsError) {
        throw cartItemsError;
      }

      // Update product stocks
      for (const item of cart) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const { error: updateStockError } = await supabase
            .from('products')
            .update({ current_stock: product.current_stock - item.quantity })
            .eq('id', item.product_id);

          if (updateStockError) {
            throw updateStockError;
          }
        }
      }

      return transactionNumber;
    },
    onSuccess: (transactionNumber) => {
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      clearCart();
      toast({
        title: 'Transaksi Berhasil',
        description: `Transaksi dengan nomor ${transactionNumber} berhasil diproses`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Transaksi Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        toast({
          title: 'Stok tidak mencukupi',
          description: `Stok tersedia: ${product.current_stock}`,
          variant: 'destructive'
        });
        return;
      }
      
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      const effectivePrice = getEffectivePrice(product, 1);
      setCart([...cart, {
        id: product.id,
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: effectivePrice,
        total_price: effectivePrice,
        image_url: product.image_url,
        loyalty_points: product.loyalty_points,
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.current_stock) {
      toast({
        title: 'Stok tidak mencukupi',
        description: `Stok tersedia: ${product.current_stock}`,
        variant: 'destructive'
      });
      return;
    }

    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity, total_price: quantity * item.unit_price }
        : item
    ));
  };

  const getEffectivePrice = (product: any, quantity: number) => {
    if (product.price_variants && product.price_variants.length > 0) {
      const applicableVariant = product.price_variants
        .filter((variant: any) => quantity >= variant.minimum_quantity && variant.is_active)
        .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity)[0];
      
      return applicableVariant ? applicableVariant.price : product.selling_price;
    }
    return product.selling_price;
  };

  const getTotalAmount = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    return Math.max(0, subtotal - discountAmount);
  };

  const getChangeAmount = () => {
    if (paymentType !== 'cash') return 0;
    return Math.max(0, paymentAmount - getTotalAmount());
  };

  const getTotalPointsEarned = () => {
    if (!selectedCustomer) return 0;
    return cart.reduce((sum, item) => sum + (item.loyalty_points * item.quantity), 0);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerId('');
    setCustomerName('');
    setDiscountAmount(0);
    setPointsUsed(0);
    setPaymentAmount(0);
    setPaymentType('cash');
    setTransferReference('');
  };

  const handleVoiceSearch = (text: string) => {
    setSearchTerm(text);
    setCurrentPage(1);
  };

  return {
    products,
    isLoading,
    cart,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    setCurrentPage: (page: number) => setCurrentPage(page),
    itemsPerPage: ITEMS_PER_PAGE,
    totalItems: productsCount,
    customers: customers || [],
    selectedCustomer,
    setSelectedCustomer,
    customerId,
    setCustomerId,
    customerName,
    setCustomerName,
    discountAmount,
    setDiscountAmount,
    pointsUsed,
    setPointsUsed,
    paymentAmount,
    setPaymentAmount,
    paymentType,
    setPaymentType,
    transferReference,
    setTransferReference,
    getTotalAmount,
    getChangeAmount,
    getTotalPointsEarned,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    processTransaction,
    handleVoiceSearch,
    isListening,
    getEffectivePrice
  };
};
