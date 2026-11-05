"use strict";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, itemKey } from "@/context/CartContext";
import { useCountry } from "@/context/CountryContext";
export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount
  } = useCart();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();
  const goToShop = () => {
    closeCart();
    navigate("/shop");
  };
  return <Sheet open={isCartOpen} onOpenChange={(o) => o ? void 0 : closeCart()}><SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md"><SheetHeader className="border-b border-border p-6 pb-4"><SheetTitle>YOUR BAG ({cartCount})</SheetTitle><SheetDescription className="sr-only">
            Shopping bag contents
          </SheetDescription></SheetHeader>{cart.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"><ShoppingBag className="h-10 w-10 text-muted-foreground" /><p className="font-display text-xl tracking-widest">
              YOUR BAG IS EMPTY
            </p><p className="text-sm text-muted-foreground">
              Add something sleek to get started.
            </p><Button onClick={goToShop} className="mt-2">
              CONTINUE SHOPPING
            </Button></div> : <><div className="flex-1 divide-y divide-border overflow-y-auto px-6">{cart.map((item) => {
    const key = itemKey(item.productId, item.size, item.color);
    return <div key={key} className="flex gap-4 py-5"><img
      src={item.image}
      alt={item.name}
      loading="lazy"
      className="h-28 w-21 shrink-0 object-cover"
      style={{ width: "5.25rem" }}
    /><div className="flex min-w-0 flex-1 flex-col"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold uppercase tracking-wide">{item.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.size} / {item.color}</p></div><button
      onClick={() => removeFromCart(key)}
      className="text-muted-foreground transition-colors hover:text-destructive"
      aria-label={`Remove ${item.name}`}
    ><Trash2 className="h-4 w-4" /></button></div><div className="mt-auto flex items-center justify-between pt-3"><div className="flex items-center border border-border"><button
      onClick={() => updateQuantity(key, -1)}
      className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-secondary"
      aria-label="Decrease quantity"
    ><Minus className="h-3 w-3" /></button><span className="w-8 text-center text-sm">{item.quantity}</span><button
      onClick={() => updateQuantity(key, 1)}
      className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-secondary"
      aria-label="Increase quantity"
    ><Plus className="h-3 w-3" /></button></div><span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span></div></div></div>;
  })}</div><div className="border-t border-border p-6"><div className="mb-1 flex items-center justify-between"><span className="font-display text-lg tracking-widest">
                  SUBTOTAL
                </span><span className="text-lg font-semibold">{formatPrice(cartTotal)}</span></div><p className="mb-4 text-xs text-muted-foreground">
                Shipping calculated at checkout.
              </p><Button
    className="w-full"
    size="lg"
    onClick={() => navigate("/checkout", { state: { from: "cart" } })}
  >
                CHECKOUT
              </Button><button
    onClick={clearCart}
    className="mt-3 w-full text-center text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
  >
                CLEAR BAG
              </button></div></>}</SheetContent></Sheet>;
}
