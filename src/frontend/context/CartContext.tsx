import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem } from "../types";

interface PromoInfo {
  id: string;
  code: string;
  title: string;
  discountAmount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  appliedPromo: PromoInfo | null;
  applyPromo: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromo: () => void;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("sweetlayers_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedPromo, setAppliedPromo] = useState<PromoInfo | null>(() => {
    try {
      const saved = localStorage.getItem("sweetlayers_promo");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sweetlayers_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedPromo) {
      localStorage.setItem("sweetlayers_promo", JSON.stringify(appliedPromo));
    } else {
      localStorage.removeItem("sweetlayers_promo");
    }
  }, [appliedPromo]);

  const subtotal = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const totalItemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  // Recalculate promo if subtotal changes
  useEffect(() => {
    if (appliedPromo && items.length > 0) {
      fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedPromo.code, subtotal }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setAppliedPromo(data.promo);
          } else {
            setAppliedPromo(null);
          }
        })
        .catch(() => {});
    } else if (items.length === 0) {
      setAppliedPromo(null);
    }
  }, [subtotal]);

  const addToCart = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.variantId === newItem.variantId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIdx].quantity;
        const newQty = Math.min(newItem.maxStock, currentQty + newItem.quantity);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          notes: newItem.notes || updated[existingIdx].notes,
        };
        return updated;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (variantId: string) => {
    setItems((prev) => prev.filter((it) => it.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.variantId === variantId) {
          const boundedQty = Math.min(it.maxStock, quantity);
          return { ...it, quantity: boundedQty };
        }
        return it;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
  };

  const applyPromo = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!code.trim()) {
      return { success: false, message: "Ketikkan kode promo terlebih dahulu" };
    }
    if (subtotal === 0) {
      return { success: false, message: "Tambahkan produk ke keranjang terlebih dahulu" };
    }

    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        return { success: false, message: data.message || "Kode promo tidak valid" };
      }

      setAppliedPromo(data.promo);
      return { success: true, message: `Promo ${data.promo.code} berhasil dipasang!` };
    } catch (err: any) {
      return { success: false, message: "Gagal memvalidasi promo: " + err.message };
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedPromo,
        applyPromo,
        removePromo,
        subtotal,
        discountAmount,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
