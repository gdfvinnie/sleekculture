"use strict";
import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { CartDrawer } from "@/components/CartDrawer";
import Index from "@/pages/Index";
import Shop from "@/pages/Shop";
import NewArrivals from "@/pages/NewArrivals";
import Accessories from "@/pages/Accessories";
import ProductDetail from "@/pages/ProductDetail";
import Foundation from "@/pages/Foundation";
import Contact from "@/pages/Contact";
import Auth from "@/pages/Auth";
import Account from "@/pages/Account";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Info from "@/pages/Info";
import NotFound from "@/pages/NotFound";

/* The admin dashboard is the heaviest screen and no shopper ever needs it, so
   it is split into its own chunk instead of blocking the storefront bundle. */
const Admin = lazy(() => import("@/pages/Admin"));
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  return <div className="flex min-h-screen flex-col"><ScrollToTop />{
    /* Each page renders Navbar + Footer itself so the home hero can sit
       under a transparent navbar. */
  }<div className="flex flex-1 flex-col"><Routes><Route path="/" element={<Index />} /><Route path="/shop" element={<Shop />} /><Route path="/new-arrivals" element={<NewArrivals />} /><Route path="/accessories" element={<Accessories />} /><Route path="/collections" element={<Shop />} /><Route path="/product/:id" element={<ProductDetail />} /><Route path="/foundation" element={<Foundation />} /><Route path="/foundation/:slug" element={<Foundation />} /><Route path="/contact" element={<Contact />} />
        <Route path="/shipping" element={<Info page="shipping" />} />
        <Route path="/size-guide" element={<Info page="size-guide" />} />
        <Route path="/faq" element={<Info page="faq" />} />
        <Route path="/privacy" element={<Info page="privacy" />} />
        <Route path="/terms" element={<Info page="terms" />} /><Route path="/account" element={<Account />} /><Route path="/auth" element={<Auth />} /><Route path="/checkout" element={<Checkout />} /><Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} /><Route path="/admin" element={<Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Loading…</p></div>}><Admin /></Suspense>} /><Route path="*" element={<NotFound />} /></Routes></div><CartDrawer /></div>;
}
