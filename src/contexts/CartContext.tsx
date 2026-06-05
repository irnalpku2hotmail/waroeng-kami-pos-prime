
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stock: number;
  flashSalePrice?: number;
  isFlashSale?: boolean;
  product_id: string;
  unit_price: number;
  total_price: number;
  // Bundle integrity fields
  bundle_id?: string | null;
  is_bundle?: boolean;
  original_price?: number;
  bundle_price?: number;
  bundle_total_items?: number; // expected number of distinct products in the bundle
  bundle_quantity?: number; // original quantity defined by the bundle (max allowed at bundle price)
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export interface CartAuditEntry {
  timestamp: number;
  action: 'add' | 'update_quantity' | 'remove' | 'revert_bundle' | 'clear';
  source: 'bundle' | 'manual' | 'system';
  productId?: string;
  bundleId?: string | null;
  fromQuantity?: number;
  toQuantity?: number;
  reason?: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  addItem: (item: Omit<CartItem, 'id' | 'product_id' | 'unit_price' | 'total_price'> & { id: string }) => void;
  removeFromCart: (id: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (id: string, quantity: number, bundleId?: string | null) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getEstimatedPoints: () => number;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  shippingCost: number;
  setShippingCost: React.Dispatch<React.SetStateAction<number>>;
  auditLog: CartAuditEntry[];
  revertBundle: (bundleId: string, reason: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Per-user storage key: each customer has their own isolated cart.
  // Guests share a single 'cart_guest' key on the device.
  const storageKey = user?.id ? `cart_${user.id}` : 'cart_guest';
  const auditKey = user?.id ? `cart_audit_log_${user.id}` : 'cart_audit_log_guest';

  const [items, setItems] = useState<CartItem[]>([]);
  const [auditLog, setAuditLog] = useState<CartAuditEntry[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [shippingCost, setShippingCost] = useState(0);

  // Load cart whenever the active user changes (login/logout/switch account).
  // This isolates carts per customer and prevents leakage across sessions.
  useEffect(() => {
    try {
      // One-time migration: move legacy global 'cart' into guest bucket
      // so existing guests don't lose their cart on this release.
      const legacy = localStorage.getItem('cart');
      if (legacy && !localStorage.getItem('cart_guest')) {
        localStorage.setItem('cart_guest', legacy);
      }
      if (legacy) localStorage.removeItem('cart');

      const savedCart = localStorage.getItem(storageKey);
      setItems(savedCart ? JSON.parse(savedCart) : []);

      const savedAudit = localStorage.getItem(auditKey);
      setAuditLog(savedAudit ? JSON.parse(savedAudit) : []);
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setItems([]);
      setAuditLog([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist cart per user key
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    const capped = auditLog.slice(-200);
    localStorage.setItem(auditKey, JSON.stringify(capped));
  }, [auditLog, auditKey]);

  const logAudit = (entry: Omit<CartAuditEntry, 'timestamp'>) => {
    const full: CartAuditEntry = { ...entry, timestamp: Date.now() };
    // eslint-disable-next-line no-console
    console.info('[CartAudit]', full);
    setAuditLog(prev => [...prev.slice(-199), full]);
  };

  const addToCart = (newItem: CartItem) => {
    setItems(prevItems => {
      // Bundle items must not merge with manually-added items of the same product.
      // Match only when bundle_id matches (both undefined/null = manual; both same id = same bundle).
      const existingItemIndex = prevItems.findIndex(
        item => item.id === newItem.id && (item.bundle_id ?? null) === (newItem.bundle_id ?? null)
      );
      
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;
        
        if (newQuantity > newItem.stock) {
          toast({
            title: 'Stok tidak mencukupi',
            description: `Stok tersedia: ${newItem.stock}`,
            variant: 'destructive',
          });
          return prevItems;
        }
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total_price: newItem.unit_price * newQuantity
        };
        logAudit({
          action: 'update_quantity',
          source: newItem.bundle_id ? 'bundle' : 'manual',
          productId: newItem.id,
          bundleId: newItem.bundle_id ?? null,
          fromQuantity: existingItem.quantity,
          toQuantity: newQuantity,
          reason: 'addToCart merge',
        });
        return updatedItems;
      } else {
        if (newItem.quantity > newItem.stock) {
          toast({
            title: 'Stok tidak mencukupi',
            description: `Stok tersedia: ${newItem.stock}`,
            variant: 'destructive',
          });
          return prevItems;
        }
        
        const cartItem: CartItem = {
          ...newItem,
          product_id: newItem.id,
          unit_price: newItem.price,
          total_price: newItem.price * newItem.quantity,
          product: {
            id: newItem.id,
            name: newItem.name,
            image_url: newItem.image
          }
        };
        logAudit({
          action: 'add',
          source: newItem.bundle_id ? 'bundle' : 'manual',
          productId: newItem.id,
          bundleId: newItem.bundle_id ?? null,
          toQuantity: newItem.quantity,
        });
        return [...prevItems, cartItem];
      }
    });
  };

  const addItem = (item: Omit<CartItem, 'id' | 'product_id' | 'unit_price' | 'total_price'> & { id: string }) => {
    const cartItem: CartItem = {
      ...item,
      product_id: item.id,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      product: {
        id: item.id,
        name: item.name,
        image_url: item.image
      }
    };
    addToCart(cartItem);
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => {
      const target = prevItems.find(item => item.id === id);
      const bundleId = target?.bundle_id;
      logAudit({
        action: 'remove',
        source: bundleId ? 'bundle' : 'manual',
        productId: target?.product_id ?? id,
        bundleId: bundleId ?? null,
        fromQuantity: target?.quantity,
        toQuantity: 0,
        reason: bundleId ? 'bundle item removed → siblings reverted to normal price' : undefined,
      });
      // If item belongs to a bundle, revert sibling items to original price
      if (bundleId) {
        return prevItems
          .filter(item => item.id !== id)
          .map(item => {
            if (item.bundle_id === bundleId) {
              const original = item.original_price ?? item.unit_price;
              return {
                ...item,
                unit_price: original,
                price: original,
                total_price: original * item.quantity,
                is_bundle: false,
                bundle_id: null,
                bundle_price: undefined,
                bundle_total_items: undefined,
              };
            }
            return item;
          });
      }
      return prevItems.filter(item => item.id !== id);
    });
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => {
      const target = prevItems.find(item => item.product_id === productId);
      const bundleId = target?.bundle_id;
      logAudit({
        action: 'remove',
        source: bundleId ? 'bundle' : 'manual',
        productId,
        bundleId: bundleId ?? null,
        fromQuantity: target?.quantity,
        toQuantity: 0,
        reason: bundleId ? 'bundle item removed → siblings reverted to normal price' : undefined,
      });
      if (bundleId) {
        return prevItems
          .filter(item => item.product_id !== productId)
          .map(item => {
            if (item.bundle_id === bundleId) {
              const original = item.original_price ?? item.unit_price;
              return {
                ...item,
                unit_price: original,
                price: original,
                total_price: original * item.quantity,
                is_bundle: false,
                bundle_id: null,
                bundle_price: undefined,
                bundle_total_items: undefined,
              };
            }
            return item;
          });
      }
      return prevItems.filter(item => item.product_id !== productId);
    });
  };

  const updateQuantity = (id: string, quantity: number, bundleId?: string | null) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => {
        // Match by id/product_id AND bundle_id to keep bundle items isolated from manual items.
        const idMatches = item.id === id || item.product_id === id;
        const bundleMatches = bundleId === undefined
          ? true
          : (item.bundle_id ?? null) === (bundleId ?? null);
        if (idMatches && bundleMatches) {
          if (quantity > item.stock) {
            toast({
              title: 'Stok tidak mencukupi',
              description: `Stok tersedia: ${item.stock}`,
              variant: 'destructive',
            });
            logAudit({
              action: 'update_quantity',
              source: item.bundle_id ? 'bundle' : 'manual',
              productId: item.product_id,
              bundleId: item.bundle_id ?? null,
              fromQuantity: item.quantity,
              toQuantity: quantity,
              reason: `rejected: stok hanya ${item.stock}`,
            });
            return item;
          }
          // Anti-exploit: bundle items cannot exceed their original bundle quantity
          // at the discounted price. To buy more, user adds the product manually at normal price.
          if (item.bundle_id && item.bundle_quantity && quantity > item.bundle_quantity) {
            toast({
              title: 'Batas Quantity Bundle',
              description: `Maksimal ${item.bundle_quantity} di harga paket. Tambahkan terpisah untuk lebih.`,
              variant: 'destructive',
            });
            logAudit({
              action: 'update_quantity',
              source: 'bundle',
              productId: item.product_id,
              bundleId: item.bundle_id ?? null,
              fromQuantity: item.quantity,
              toQuantity: quantity,
              reason: `capped at bundle_quantity ${item.bundle_quantity}`,
            });
            return { ...item, quantity: item.bundle_quantity, total_price: item.unit_price * item.bundle_quantity };
          }
          logAudit({
            action: 'update_quantity',
            source: item.bundle_id ? 'bundle' : 'manual',
            productId: item.product_id,
            bundleId: item.bundle_id ?? null,
            fromQuantity: item.quantity,
            toQuantity: quantity,
          });
          return { 
            ...item, 
            quantity,
            total_price: item.unit_price * quantity,
            // Preserve bundle integrity flags explicitly.
            is_bundle: item.is_bundle,
            bundle_id: item.bundle_id,
            bundle_price: item.bundle_price,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    logAudit({ action: 'clear', source: 'system' });
    setItems([]);
  };

  // Revert all items belonging to a bundle back to normal price (bundle integrity broken).
  const revertBundle = (bundleId: string, reason: string) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.bundle_id === bundleId) {
        const original = item.original_price ?? item.unit_price;
        return {
          ...item,
          unit_price: original,
          price: original,
          total_price: original * item.quantity,
          is_bundle: false,
          bundle_id: null,
          bundle_price: undefined,
          bundle_total_items: undefined,
        };
      }
      return item;
    }));
    logAudit({
      action: 'revert_bundle',
      source: 'system',
      bundleId,
      reason,
    });
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = item.isFlashSale && item.flashSalePrice ? item.flashSalePrice : item.unit_price;
      return total + (price * item.quantity);
    }, 0);
  };

  // Loyalty point estimate — uses the SAME formula as POS/checkout:
  // points = SUM(product.loyalty_points * quantity), defaulting to 1 per product
  // (matching usePOS.ts behavior). Fetched live from the products table so the
  // estimate matches what the loyalty trigger will actually award.
  const productIds = Array.from(new Set(items.map(i => i.product_id || i.id).filter(Boolean)));
  const { data: loyaltyMap } = useQuery({
    queryKey: ['cart-loyalty-points', productIds.sort().join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from('products')
        .select('id, loyalty_points')
        .in('id', productIds);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((p: any) => { map[p.id] = p.loyalty_points ?? 1; });
      return map;
    },
    enabled: productIds.length > 0,
    staleTime: 60_000,
  });

  const getEstimatedPoints = () => {
    if (!loyaltyMap) return 0;
    return items.reduce((total, item) => {
      const pid = item.product_id || item.id;
      const perUnit = loyaltyMap[pid] ?? 1;
      return total + perUnit * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      addItem,
      removeFromCart,
      removeItem,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getEstimatedPoints,
      customerInfo,
      setCustomerInfo,
      shippingCost,
      setShippingCost,
      auditLog,
      revertBundle,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
