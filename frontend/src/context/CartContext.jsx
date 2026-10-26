import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('tm_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [selectedNursery, setSelectedNursery] = useState(() => {
    const saved = localStorage.getItem('tm_selected_nursery');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('tm_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('tm_selected_nursery', JSON.stringify(selectedNursery));
  }, [selectedNursery]);

  const addToCart = (plant, nursery, quantity = 1) => {
    // If nursery is changing, update nursery
    if (!selectedNursery || (nursery && selectedNursery.maVuonUom !== nursery.maVuonUom)) {
      if (nursery) setSelectedNursery(nursery);
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.maCay === plant.maCay);
      if (existing) {
        return prev.map((item) =>
          item.maCay === plant.maCay ? { ...item, soLuong: item.soLuong + quantity } : item
        );
      }
      return [
        ...prev,
        {
          maCay: plant.maCay,
          tenCay: plant.tenCay,
          tenKhoaHoc: plant.tenKhoaHoc,
          giaBan: Number(plant.giaBan),
          khoiLuongKg: Number(plant.khoiLuongKg || 2.0),
          anhChinh: plant.anhChinh || (plant.hinhAnh && plant.hinhAnh[0]?.duongDan) || '',
          soLuong: quantity,
          nursery: nursery || selectedNursery,
        },
      ];
    });
  };

  const updateQuantity = (maCay, quantity) => {
    if (quantity <= 0) {
      removeFromCart(maCay);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.maCay === maCay ? { ...item, soLuong: quantity } : item))
    );
  };

  const removeFromCart = (maCay) => {
    setCartItems((prev) => prev.filter((item) => item.maCay !== maCay));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.soLuong, 0);
  const subTotal = cartItems.reduce((sum, item) => sum + item.giaBan * item.soLuong, 0);
  const totalWeightKg = cartItems.reduce((sum, item) => sum + item.khoiLuongKg * item.soLuong, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedNursery,
        setSelectedNursery,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subTotal,
        totalWeightKg,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
