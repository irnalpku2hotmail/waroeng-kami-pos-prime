
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  current_stock: number;
  original_price?: number;
  is_wholesale?: boolean;
  wholesale_min_qty?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    email: string;
  };
  setCustomerInfo: (info: any) => void;
  shippingCost: number;
  setShippingCost: (cost: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('smartpos_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem('smartpos_cart');
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('smartpos_cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  // Sync customer info with profile when available
  useEffect(() => {
    if (profile) {
      setCustomerInfo(prev => ({
        name: profile.full_name || prev.name,
        phone: profile.phone || prev.phone,
        address: profile.address || prev.address,
        email: profile.email || prev.email
      }));
    }
  }, [profile]);

  const addItem = (item: CartItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.product_id === item.product_id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + item.quantity;
        return currentItems.map(i =>
          i.product_id === item.product_id
            ? {
                ...i,
                quantity: newQuantity,
                total_price: newQuantity * i.unit_price
              }
            : i
        );
      }
      
      return [...currentItems, item];
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              total_price: quantity * item.unit_price
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('smartpos_cart');
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.total_price, 0);
  };

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    customerInfo,
    setCustomerInfo,
    shippingCost,
    setShippingCost
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
