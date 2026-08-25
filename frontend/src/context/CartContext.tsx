import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  images: any[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

interface CartContextType {
  cart: Cart | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  fetchCart: () => Promise<void>;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);

  const getGuestId = () => {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };

  const fetchCart = async () => {
    try {
      const guestId = getGuestId();
      const res = await api.get('/cart', { params: { guestId } });
      setCart(res.data);
    } catch (error) {
      console.error('Failed to fetch cart', error);
    }
  };

  const mergeCart = async () => {
    try {
      const guestId = localStorage.getItem('guestId');
      if (guestId && isAuthenticated) {
        await api.post('/cart/merge', { guestId });
        localStorage.removeItem('guestId'); // Once merged, guestId is no longer needed
      }
    } catch (error) {
      console.error('Failed to merge cart', error);
    }
  };

  useEffect(() => {
    // When auth state changes to authenticated, merge cart first
    const init = async () => {
      if (isAuthenticated) {
        await mergeCart();
      }
      await fetchCart();
    };
    init();
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const guestId = getGuestId();
      await api.post('/cart/items', { productId, quantity, guestId });
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart', error);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await api.put(`/cart/items/${cartItemId}`, { quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity', error);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await api.delete(`/cart/items/${cartItemId}`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart', error);
    }
  };

  const totalAmount = cart?.items.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0) || 0;

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, fetchCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
