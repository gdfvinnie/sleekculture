import { useEffect } from "react";
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
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {/* Each page renders Navbar + Footer itself so the home hero can sit
          under a transparent navbar. */}
      <div className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/collections" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/foundation" element={<Foundation />} />
          <Route path="/foundation/:slug" element={<Foundation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/account" element={<Account />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <CartDrawer />
    </div>
  );
}
