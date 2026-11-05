"use strict";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Package } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCountry } from "@/context/CountryContext";
import { api } from "@/lib/api";
export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const { formatPrice } = useCountry();
  const [order, setOrder] = useState(state?.order ?? null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (order || !orderId) return;
    // Deep-linked or refreshed: fetch by id (without email, shipping is hidden).
    api
      .getOrder(orderId)
      .then(setOrder)
      .catch(() => setFailed(true));
  }, [orderId, order]);
  if (failed) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 pb-24 pt-16 text-center">
          <div>
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-display text-3xl tracking-widest">ORDER NOT FOUND</p>
            <p className="mt-3 text-sm text-muted-foreground">
              We couldn't find that order. If you just placed it, check your email.
            </p>
            <Button asChild className="mt-6">
              <Link to="/shop">CONTINUE SHOPPING</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center pb-24 pt-16">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Loading your order…
          </p>
        </main>
      </div>
    );
  }
  const paid = order.paymentStatus === "succeeded" || order.paymentStatus === "paid";
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-24 pt-16 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-2xl"
        >
          <div className="pt-10 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 16 }}
            >
              <CheckCircle2 className="mx-auto h-14 w-14 text-accent" strokeWidth={1.5} />
            </motion.div>
            <h1 className="mt-6 font-display text-4xl tracking-wide sm:text-5xl">
              ORDER CONFIRMED
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Order <span className="font-semibold text-foreground">{order.orderNumber}</span>
              {" · "}
              {paid ? "Payment received" : order.paymentStatus === "failed" ? "Payment failed" : "Awaiting payment"}
            </p>
          </div>
          {!paid && order.paymentMethod === "bank_transfer" && (
            <div className="mt-8 border border-border bg-secondary/40 p-5 text-sm">
              <p className="font-display tracking-widest">BANK TRANSFER</p>
              <p className="mt-2 text-muted-foreground">
                Transfer <span className="font-semibold text-foreground">{formatPrice(order.total)}</span> to
                the sleekculture account. Account details have been sent to{" "}
                <span className="font-semibold text-foreground">{order.shipping?.email || "your email"}</span>.
                Your order ships as soon as payment is confirmed.
              </p>
            </div>
          )}
          {!paid && order.paymentMethod === "pay_on_delivery" && (
            <div className="mt-8 border border-border bg-secondary/40 p-5 text-sm">
              <p className="font-display tracking-widest">PAY ON DELIVERY</p>
              <p className="mt-2 text-muted-foreground">
                Have <span className="font-semibold text-foreground">{formatPrice(order.total)}</span> ready
                (cash or transfer on arrival). Our rider will call the number provided.
              </p>
            </div>
          )}
          <div className="mt-8 border border-border">
            <div className="border-b border-border p-5">
              <p className="font-display text-sm tracking-widest">ITEMS</p>
              <div className="mt-3 divide-y divide-border">
                {(order.items ?? []).map((it, i) => (
                  <div key={`${it.productId}-${i}`} className="flex items-center gap-3 py-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden border border-border bg-secondary">
                      {it.image && (
                        <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold uppercase tracking-wide">{it.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {it.size} / {it.color} × {it.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span className="font-display text-lg">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
          {order.shipping?.fullName && (
            <div className="mt-6 border border-border p-5 text-sm">
              <p className="font-display text-sm tracking-widest">DELIVERY TO</p>
              <p className="mt-2 text-muted-foreground">
                {order.shipping.fullName}
                <br />
                {order.shipping.address}
                <br />
                {[order.shipping.city, order.shipping.state, order.shipping.country]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {order.shipping.phone}
              </p>
            </div>
          )}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/shop">CONTINUE SHOPPING</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/foundation">ABOUT THE BRAND</Link>
            </Button>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Questions about your order? Reach us on Instagram{" "}
            <a
              href="https://www.instagram.com/sleekculture"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              @sleekculture
            </a>
            .
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
