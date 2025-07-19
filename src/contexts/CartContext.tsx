
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

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
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
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
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  shippingCost: number;
  setShippingCost: React.Dispatch<React.SetStateAction<number>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [shippingCost, setShippingCost] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === newItem.id);
      
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
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id || item.product_id === id) {
          if (quantity > item.stock) {
            toast({
              title: 'Stok tidak mencukupi',
              description: `Stok tersedia: ${item.stock}`,
              variant: 'destructive',
            });
            return item;
          }
          return { 
            ...item, 
            quantity,
            total_price: item.unit_price * quantity
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
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
      customerInfo,
      setCustomerInfo,
      shippingCost,
      setShippingCost,
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
