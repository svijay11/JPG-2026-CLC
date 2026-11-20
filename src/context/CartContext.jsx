import React, { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [orderMeta, setOrderMeta] = useState(null);

  const value = useMemo(() => ({
    cart,
    setCart,
    addToCart: (item) => setCart((prev) => [...prev, item]),
    removeFromCart: (index) => setCart((prev) => prev.filter((_, i) => i !== index)),
    clearCart: () => setCart([]),
    completedOrder,
    setCompletedOrder,
    orderMeta,
    setOrderMeta,
    completeOrder: (items, meta = {}) => {
      setCompletedOrder(items.map((item) => ({ ...item })));
      setOrderMeta(meta);
      setCart([]);
    },
    clearCompletedOrder: () => {
      setCompletedOrder(null);
      setOrderMeta(null);
    }
  }), [cart, completedOrder, orderMeta]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
