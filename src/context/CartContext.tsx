"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  weight: string;
  quantity: number;
  sauce?: string;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  getQuantity: (id: string, sauce?: string) => number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string, sauce?: string) => void;
  setQuantity: (id: string, quantity: number, sauce?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "victoria-cafe-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  // Ленивый инициализатор читает localStorage синхронно при монтировании —
  // без отдельного эффекта "гидратации", который раньше вызывал setState
  // прямо в эффекте (react-hooks/set-state-in-effect).
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage недоступен — корзина просто не сохранится между визитами
    }
  }, [items]);

  const addItem: CartContextValue["addItem"] = (item) => {
    setItems((current) => {
      const existing = current.find(
        (i) => i.id === item.id && i.sauce === item.sauce,
      );
      if (existing) {
        return current.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const removeItem: CartContextValue["removeItem"] = (id, sauce) => {
    setItems((current) => current.filter((i) => !(i.id === id && i.sauce === sauce)));
  };

  const setQuantity: CartContextValue["setQuantity"] = (id, quantity, sauce) => {
    if (quantity <= 0) {
      removeItem(id, sauce);
      return;
    }
    setItems((current) =>
      current.map((i) => (i.id === id && i.sauce === sauce ? { ...i, quantity } : i)),
    );
  };

  const clearCart = () => setItems([]);

  const getQuantity = (id: string, sauce?: string) =>
    items.find((i) => i.id === id && i.sauce === sauce)?.quantity ?? 0;

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        getQuantity,
        addItem,
        removeItem,
        setQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
