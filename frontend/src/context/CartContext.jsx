import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null); // { id, name, phone, email, address }
  const [discountPercent, setDiscountPercent] = useState(0);

  // Add variant to cart
  const addToCart = (variant, requestedQty = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.variant.id === variant.id);
      const availableStock = variant.inventory ? variant.inventory.quantity : 0;

      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        const newQty = currentQty + requestedQty;

        if (newQty > availableStock) {
          throw new Error(`Cannot add more. Only ${availableStock} pairs available in stock.`);
        }

        const updated = [...prev];
        updated[existingIdx].quantity = newQty;
        return updated;
      } else {
        if (requestedQty > availableStock) {
          throw new Error(`Cannot add to cart. Only ${availableStock} pairs available in stock.`);
        }

        return [...prev, { variant, quantity: requestedQty, discountPercent: 0 }];
      }
    });
  };

  const updateQuantity = (variantId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(variantId);
      return;
    }

    setItems((prev) => {
      return prev.map((item) => {
        if (item.variant.id === variantId) {
          const availableStock = item.variant.inventory ? item.variant.inventory.quantity : 0;
          if (newQty > availableStock) {
            throw new Error(`Quantity exceeds stock limit (${availableStock} pairs).`);
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (variantId) => {
    setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  };

  const clearCart = () => {
    setItems([]);
    setCustomer(null);
    setDiscountPercent(0);
  };

  // Financial calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalPairs = 0;

    items.forEach((item) => {
      let unitPrice = item.variant.sellingPrice;
      // clearance discount if approved
      if (item.variant.clearanceApproved && item.variant.clearanceDiscount > 0) {
        unitPrice = Math.round(unitPrice * (1 - item.variant.clearanceDiscount / 100));
      }

      const itemTotal = unitPrice * item.quantity;
      const gstRate = unitPrice > 1000 ? 12 : 5;
      const taxAmount = Math.round((itemTotal * gstRate) / 100);

      subtotal += itemTotal;
      totalTax += taxAmount;
      totalPairs += item.quantity;
    });

    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const grandTotal = Math.max(0, subtotal + totalTax - discountAmount);

    return {
      subtotal,
      totalTax,
      totalPairs,
      discountPercent,
      discountAmount,
      grandTotal,
    };
  }, [items, discountPercent]);

  return (
    <CartContext.Provider
      value={{
        items,
        customer,
        setCustomer,
        discountPercent,
        setDiscountPercent,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
