"use strict";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useToast } from "@/components/ui/toast";
const CartContext = createContext(void 0);
const itemKey = (productId, size, color) => `${productId}__${size}__${color}`;
export { itemKey };
export function CartProvider({ children }) {
  const { toast } = useToast();
  /* Read the saved bag in the state initializer rather than in an effect.
     Reading in an effect raced the write effect below: on mount the write ran
     with the still-empty state and wiped the saved bag (StrictMode's double
     mount made it reliably lose the cart on refresh). */
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("sleekculture-cart");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter(
            (i) => i && i.productId && Number.isFinite(Number(i.price))
          ).map((i) => ({ ...i, quantity: Math.max(1, Number(i.quantity) || 1) }))
        : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("sleekculture-cart", JSON.stringify(cart));
    } catch {
    }
  }, [cart]);
  /* Stable identities: the drawer closes itself on navigation, and a new
     function identity each render would slam it shut the moment it opened. */
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const addToCart = ({
    product,
    size,
    color,
    quantity
  }) => {
    setCart((prev) => {
      const key = itemKey(product.id, size, color);
      const existing = prev.find(
        (i) => itemKey(i.productId, i.size, i.color) === key
      );
      if (existing) {
        return prev.map(
          (i) => itemKey(i.productId, i.size, i.color) === key ? { ...i, quantity: Math.min(i.quantity + quantity, 10) } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.images[0],
          size,
          color,
          quantity
        }
      ];
    });
    toast({
      title: "ADDED TO BAG",
      description: `${product.name} \u2014 ${size} / ${color}`
    });
  };
  const removeFromCart = (key) => {
    setCart(
      (prev) => prev.filter((i) => itemKey(i.productId, i.size, i.color) !== key)
    );
  };
  const updateQuantity = (key, delta) => {
    setCart(
      (prev) => prev.map(
        (i) => itemKey(i.productId, i.size, i.color) === key ? { ...i, quantity: Math.max(0, Math.min(10, i.quantity + delta)) } : i
      ).filter((i) => i.quantity > 0)
    );
  };
  const clearCart = () => setCart([]);
  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );
  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart]
  );
  return <CartContext.Provider
    value={{
      cart,
      cartCount,
      cartTotal,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}
  >{children}</CartContext.Provider>;
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
