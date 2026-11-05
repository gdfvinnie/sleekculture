import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { ToastProviderWithViewport } from "@/components/ui/toast";
import { CountryProvider } from "@/context/CountryContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProviderWithViewport>
        <CountryProvider>
          <CartProvider>
            <AuthProvider>
              <HashRouter>
                <App />
              </HashRouter>
            </AuthProvider>
          </CartProvider>
        </CountryProvider>
      </ToastProviderWithViewport>
    </QueryClientProvider>
  </React.StrictMode>,
);
