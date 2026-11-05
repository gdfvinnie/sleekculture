"use strict";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useCountry } from "@/context/CountryContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
const PAYMENT_METHODS = [
  {
    value: "card",
    label: "Pay with Card",
    description: "Securely pay now with your debit or credit card.",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description:
      "Pay straight from your bank app. Account details are shown after you place the order.",
  },
  {
    value: "pay_on_delivery",
    label: "Pay on Delivery",
    description: "Pay cash when your order arrives at your door.",
  },
];
const inputClass =
  "w-full border border-border bg-transparent px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";
function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { formatPrice } = useCountry();
  const { user } = useAuth();
  const { placeOrder, verifyPayment } = useOrders();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  /* Fees are quoted in the same dollar amounts the catalog uses
     (free shipping over $500). */
  const shippingFee = cartTotal >= 500 ? 0 : 25;
  const total = cartTotal + shippingFee;
  // If the customer session resolves after mount, prefill the email.
  useEffect(() => {
    if (user?.email) {
      setForm((f) => (f.email ? f : { ...f, email: user.email }));
    }
  }, [user]);
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const finishOrder = (order) => {
    clearCart();
    toast({
      title: "ORDER CONFIRMED",
      description: `${order.orderNumber} — thank you for shopping sleekculture.`,
    });
    navigate(`/order-confirmation/${order.id}`, { state: { order } });
  };
  const submit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await placeOrder({
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
        shipping: form,
        paymentMethod,
      });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setServerError(result.error);
        toast({
          title: "CHECKOUT ERROR",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      const { order } = result;
      if (order.paymentStatus === "succeeded") {
        finishOrder(order);
        return;
      }
      if (paymentMethod === "card") {
        // In production this is where the Paystack modal would open; the
        // backend verifies the transaction server-side before confirming.
        const v = await verifyPayment(order.id);
        if (v?.verified) {
          finishOrder(v.order ?? order);
          return;
        }
        setServerError(
          "We couldn't confirm your payment. Please try again or use another method."
        );
        return;
      }
      // Bank transfer / pay on delivery — pending payment is the expected state.
      finishOrder(order);
    } finally {
      setSubmitting(false);
    }
  };
  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 pb-24 pt-16 text-center">
          <div>
            <p className="font-display text-3xl tracking-widest">YOUR BAG IS EMPTY</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Add something sleek before checking out.
            </p>
            <Button className="mt-6" onClick={() => navigate("/shop")}>
              CONTINUE SHOPPING
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-24 pt-16 sm:px-6 lg:px-10">
        <button
          onClick={() => navigate("/shop")}
          className="mb-8 mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Continue shopping
        </button>
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            CHECKOUT
          </p>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">SECURE CHECKOUT</h1>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <form id="checkout-form" onSubmit={submit} noValidate>
            <div className="border border-border p-6">
              <h2 className="font-display text-xl tracking-widest">SHIPPING DETAILS</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Full name" error={fieldErrors.fullName}>
                    <input
                      className={inputClass}
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      autoComplete="name"
                      placeholder="Your full name"
                    />
                  </Field>
                </div>
                <Field label="Email" error={fieldErrors.email}>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    autoComplete="email"
                    placeholder="you@email.com"
                  />
                </Field>
                <Field label="Phone" error={fieldErrors.phone}>
                  <input
                    type="tel"
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    autoComplete="tel"
                    placeholder="+234 800 000 0000"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Delivery address" error={fieldErrors.address}>
                    <input
                      className={inputClass}
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      autoComplete="street-address"
                      placeholder="12 Allen Avenue, Ikeja"
                    />
                  </Field>
                </div>
                <Field label="City" error={fieldErrors.city}>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    autoComplete="address-level2"
                    placeholder="Ikeja"
                  />
                </Field>
                <Field label="State" error={fieldErrors.state}>
                  <input
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    autoComplete="address-level1"
                    placeholder="Lagos"
                  />
                </Field>
                <Field label="Country">
                  <input className={inputClass} value="Nigeria" readOnly aria-label="Country" />
                </Field>
                <Field label="Postal code (optional)" error={fieldErrors.postalCode}>
                  <input
                    className={inputClass}
                    value={form.postalCode}
                    onChange={(e) => setField("postalCode", e.target.value)}
                    autoComplete="postal-code"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Delivery notes (optional)">
                    <textarea
                      className={inputClass + " min-h-[72px] resize-none"}
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      placeholder="Landmark, gate code, etc."
                    />
                  </Field>
                </div>
              </div>
            </div>
            <div className="mt-6 border border-border p-6">
              <h2 className="font-display text-xl tracking-widest">PAYMENT</h2>
              <div className="mt-5 grid gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={
                      "flex cursor-pointer items-start gap-3 border p-4 transition-colors " +
                      (paymentMethod === m.value
                        ? "border-accent bg-secondary/40"
                        : "border-border hover:border-foreground/40")
                    }
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={paymentMethod === m.value}
                      onChange={() => setPaymentMethod(m.value)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {m.description}
                      </span>
                    </span>
                    <span className="ml-auto mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {paymentMethod === m.value && <Check className="h-4 w-4 text-accent" />}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Mobile summary + CTA (the aside order summary is desktop-only) */}
            <div className="mt-6 border border-border bg-secondary/40 p-6 lg:hidden">
              <h2 className="font-display text-xl tracking-widest">YOUR ORDER</h2>
              <div className="mt-4 divide-y divide-border">
                {cart.map((i) => (
                  <div
                    key={`${i.productId}-${i.size}-${i.color}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <img
                      src={i.image}
                      alt={i.name}
                      className="h-16 w-16 shrink-0 border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold uppercase tracking-wide">
                        {i.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {i.size} / {i.color} × {i.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPrice(i.price * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between pt-2 font-semibold">
                  <span>Total</span>
                  <span className="font-display text-lg">{formatPrice(total)}</span>
                </div>
              </div>
              {serverError && (
                <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {serverError}
                </p>
              )}
              <Button type="submit" className="mt-5 w-full" size="lg" disabled={submitting}>
                {submitting ? "PLACING ORDER…" : `PLACE ORDER · ${formatPrice(total)}`}
              </Button>
            </div>
          </form>
          <aside className="hidden lg:block">
            <div className="border border-border bg-secondary/40 p-6">
              <h2 className="font-display text-xl tracking-widest">YOUR ORDER</h2>
              <div className="mt-4 divide-y divide-border">
                {cart.map((i) => (
                  <div
                    key={`${i.productId}-${i.size}-${i.color}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <img
                      src={i.image}
                      alt={i.name}
                      className="h-16 w-16 shrink-0 border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold uppercase tracking-wide">
                        {i.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {i.size} / {i.color} × {i.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPrice(i.price * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between pt-2 font-semibold">
                  <span>Total</span>
                  <span className="font-display text-lg">{formatPrice(total)}</span>
                </div>
              </div>
              {serverError && (
                <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {serverError}
                </p>
              )}
              <Button
                type="submit"
                form="checkout-form"
                className="mt-5 w-full"
                size="lg"
                disabled={submitting}
              >
                {submitting ? "PLACING ORDER…" : `PLACE ORDER · ${formatPrice(total)}`}
              </Button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Secure checkout — your details stay on our server
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
