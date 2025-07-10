import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    selling_price: number;
    current_stock: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalAmount: () => number; // Alias for getTotalPrice
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  shippingCost: number;
  setShippingCost: React.Dispatch<React.SetStateAction<number>>;
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
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [shippingCost, setShippingCost] = useState<number>(0);

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

  const addItem = (product: any) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.product_id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        return currentItems.map(i =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: newQuantity,
                total_price: newQuantity * i.unit_price
              }
            : i
        );
      }
      
      const newItem: CartItem = {
        id: `cart_${product.id}_${Date.now()}`,
        product_id: product.id,
        product: {
          id: product.id,
          name: product.name,
          image_url: product.image_url,
          selling_price: product.selling_price,
          current_stock: product.current_stock
        },
        quantity: 1,
        unit_price: product.selling_price,
        total_price: product.selling_price
      };
      
      return [...currentItems, newItem];
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

  const getTotalAmount = () => {
    return getTotalPrice(); // Alias for compatibility
  };

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getTotalAmount,
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
