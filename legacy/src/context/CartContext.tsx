import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/toast";
import type { CartItem, Product } from "@/types/product";

export interface AddToBagInput {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextValue {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (input: AddToBagInput) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const itemKey = (productId: string, size: string, color: string) =>
  `${productId}__${size}__${color}`;

export { itemKey };

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Rehydrate cart across page reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sleekculture-cart");
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sleekculture-cart", JSON.stringify(cart));
    } catch {
      // ignore write failures
    }
  }, [cart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart: (input: AddToBagInput) => void = ({
    product,
    size,
    color,
    quantity,
  }) => {
    setCart((prev) => {
      const key = itemKey(product.id, size, color);
      const existing = prev.find(
        (i) => itemKey(i.productId, i.size, i.color) === key,
      );
      if (existing) {
        return prev.map((i) =>
          itemKey(i.productId, i.size, i.color) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
            : i,
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
          quantity,
        },
      ];
    });
    toast({
      title: "ADDED TO BAG",
      description: `${product.name} — ${size} / ${color}`,
    });
  };

  const removeFromCart = (key: string) => {
    setCart((prev) =>
      prev.filter((i) => itemKey(i.productId, i.size, i.color) !== key),
    );
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          itemKey(i.productId, i.size, i.color) === key
            ? { ...i, quantity: Math.max(0, Math.min(10, i.quantity + delta)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  );

  return (
    <CartContext.Provider
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
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
