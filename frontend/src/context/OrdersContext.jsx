"use strict";
import { createContext, useContext, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
const OrdersContext = createContext(void 0);
export function OrdersProvider({ children }) {
  const { attachUserToOrder } = useAuth();
  // The most recently created order, for the confirmation page.
  const [lastOrder, setLastOrder] = useState(null);
  const placeOrder = async (payload) => {
    let order = null;
    try {
      order = await api.createOrder(payload);
      setLastOrder(order);
      attachUserToOrder(order);
      return { ok: true, order };
    } catch (err) {
      return { ok: false, error: err?.message ?? "Checkout failed. Please try again.", fieldErrors: err?.fieldErrors };
    }
  };
  const verifyPayment = async (orderId) => {
    try {
      const result = await api.verifyOrderPayment(orderId);
      if (result?.order) setLastOrder(result.order);
      return result;
    } catch (err) {
      return { verified: false, error: err?.message ?? "Verification failed." };
    }
  };
  return (
    <OrdersContext.Provider value={{ lastOrder, setLastOrder, placeOrder, verifyPayment }}>
      {children}
    </OrdersContext.Provider>
  );
}
export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
