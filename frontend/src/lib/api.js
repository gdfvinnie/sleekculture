"use strict";
import catalog from "@/data/catalog.json";

/**
 * Single API layer.
 *
 * - Full mode: a running storefront backend (PythonAnywhere, Render, your
 *   server) serves /api/* — accounts, orders, admin all work.
 * - Demo mode: static hosts (GitHub Pages, Netlify, Vercel static) have no
 *   Python server. The store detects this automatically and falls back to a
 *   bundled catalog. Cart + checkout keep working locally: orders are saved
 *   in the browser. Account, uploads, and the admin panel are disabled with
 *   a clear message instead of a broken screen.
 */

const DEMO_NOTE =
  "This is the public demo build (no store server attached). Products, the cart, and checkout all work; browsing orders are stored in your browser. Managing products, accounts, and real payments requires deploying with the backend (see SETUP.md).";

class ApiError extends Error {
  status;
  fieldErrors;
  offline;
  constructor(status, message, fieldErrors, offline = false) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.offline = offline;
  }
}

async function request(path, init) {
  const res = await fetch(path, {
    credentials: "same-origin",
    // send the httpOnly session cookie
    headers:
      init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : void 0,
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let fieldErrors;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      if (data.errors) {
        fieldErrors = Object.fromEntries(data.errors.map((e) => [e.field, e.message]));
        message = data.errors[0]?.message ?? message;
      }
    } catch {
    }
    throw new ApiError(res.status, message, fieldErrors);
  }
  try {
    return await res.json();
  } catch {
    // A server answered but not with JSON (e.g. an HTML 404 page).
    throw new ApiError(res.status || 502, "Unexpected server response.", void 0, true);
  }
}

/* ---------------------------------------------------------------- backend */

let backendProbe = null; // cached promise: null until first call

function detectBackend() {
  backendProbe = (async () => {
    try {
      const res = await fetch("/api/products", {
        credentials: "same-origin",
        // Short timeout — a demo storefront should not hang waiting.
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      });
      // Some static hosts rewrite unknown paths to index.html (200 + HTML).
      // A real backend always answers JSON here.
      return res.ok && (res.headers.get("content-type") || "").includes("json");
    } catch {
      return false;
    }
  })();
  return backendProbe;
}

export async function isDemo() {
  if (backendProbe === null) detectBackend();
  // detectBackend resolves true only when a real JSON backend answered.
  return !(await backendProbe);
}

/* ------------------------------------------------------------- demo state */

const ORDERS_KEY = "sleekculture-demo-orders";

function base() {
  // Works both at "/" and at "/<repo>/ " (GitHub Pages project sites).
  return (import.meta.env.BASE_URL || "/").replace(/\/*$/, "");
}

function demoProducts() {
  return catalog.map((p) => ({
    ...p,
    images: p.images.map((src) =>
      typeof src === "string" && src.startsWith("/media/")
        ? `${base()}/media/${src.slice("/media/".length)}`
        : src
    ),
  }));
}

function demoOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDemoOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(-50)));
  } catch {
  }
}

function demoOrderLookup(id) {
  return demoOrders().find((o) => o.id === id || o.orderNumber === id);
}

function makeDemoOrder(payload) {
  // The checkout payload carries no price/image — take them from the
  // bundled catalog, like the real backend does from its database.
  const demoP = demoProducts();
  const items = (payload.items || []).map((it, i) => {
    let p = null;
    try {
      p = demoP.find((prod) => prod.id === String(it.productId));
    } catch {
      p = null;
    }
    return {
      productId: String(it.productId ?? i),
      name: it.name ?? p?.name ?? "Item",
      size: it.size ?? "One Size",
      color: it.color ?? "-",
      quantity: Number(it.quantity) || 1,
      image: p?.images?.[0] ?? null,
      price: Number(it.price) || p?.price || 0,
    };
  });
  const rawShipping = payload.shipping || {};
  const shipping = Object.fromEntries(
    Object.entries(rawShipping).map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 300) : v])
  );
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  const shippingFee = subtotal >= 500 ? 0 : 25;
  const order = {
    id: `demo-${Date.now()}-${Math.floor(Math.random() * 46656).toString(36)}`,
    orderNumber:
      "SC" +
      new Date().toISOString().slice(2, 10).replace(/-/g, "") +
      "-" +
      String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
    userId: null,
    status: "processing",
    items,
    shipping,
    paymentMethod: payload.paymentMethod || "card",
    paymentStatus: "pending",
    subtotal,
    shippingFee,
    total: Math.round((subtotal + shippingFee) * 100) / 100,
    createdAt: new Date().toISOString(),
    _demo: true,
  };
  saveDemoOrders([...demoOrders().filter((o) => o.id !== order.id), order]);
  return order;
}

function offlineError() {
  return new ApiError(503, DEMO_NOTE, void 0, true);
}

/* ---------------------------------------------------------------- exports */

export const api = {
  /* ---------------- Auth (full mode only) ---------------- */
  login: async (email, password) => {
    if (await isDemo()) throw offlineError();
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  logout: async () => {
    if (await isDemo()) return { ok: true };
    return request("/api/auth/logout", { method: "POST" });
  },
  me: async () => {
    if (await isDemo()) throw offlineError();
    return request("/api/auth/me");
  },

  /* ---------------- Products ---------------- */
  products: async () => {
    if (!(await isDemo())) return request("/api/products");
    return demoProducts();
  },
  createProduct: async (payload) => {
    if (await isDemo()) throw offlineError();
    return request("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateProduct: async (id, payload) => {
    if (await isDemo()) throw offlineError();
    return request(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  deleteProduct: async (id) => {
    if (await isDemo()) throw offlineError();
    return request(`/api/products/${id}`, { method: "DELETE" });
  },
  uploadImages: async (files) => {
    if (await isDemo()) throw offlineError();
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    const data = await request("/api/upload", {
      method: "POST",
      body: form
    });
    return data.urls;
  },

  /* ---------------- Orders / checkout ---------------- */
  createOrder: async (payload) => {
    if (!(await isDemo())) {
      return request("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    return makeDemoOrder(payload);
  },
  verifyOrderPayment: async (orderId) => {
    if (!(await isDemo())) {
      return request(`/api/orders/${orderId}/verify-payment`, {
        method: "POST",
        body: JSON.stringify({})
      });
    }
    const order = demoOrderLookup(orderId);
    if (order) {
      order.paymentStatus = "succeeded";
      saveDemoOrders(demoOrders().map((o) => (o.id === order.id ? order : o)));
    }
    return { verified: true, order: order ?? null };
  },
  getOrder: async (orderId) => {
    if (!(await isDemo())) {
      return request(`/api/orders/${orderId}`);
    }
    const order = demoOrderLookup(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found.", void 0, true);
    }
    return order;
  },

  /* ---------------- Admin (full mode only) ---------------- */
  adminStats: async () => {
    if (await isDemo()) throw offlineError();
    return request("/api/admin/stats");
  },
  adminOrders: async () => {
    if (await isDemo()) throw offlineError();
    return request("/api/admin/orders");
  },
  adminUpdateOrder: async (id, patch) => {
    if (await isDemo()) throw offlineError();
    return request(`/api/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
  },
  adminCustomers: async () => {
    if (await isDemo()) throw offlineError();
    return request("/api/admin/customers");
  },
  adminCustomer: async (id) => {
    if (await isDemo()) throw offlineError();
    return request(`/api/admin/customers/${id}`);
  },
  adminSettings: async () => {
    if (await isDemo()) throw offlineError();
    return request("/api/admin/settings");
  },
  adminUpdateSettings: async (patch) => {
    if (await isDemo()) throw offlineError();
    return request("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(patch)
    });
  },
  adminChangePassword: async (currentPassword, newPassword) => {
    if (await isDemo()) throw offlineError();
    return request("/api/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },
};
export { ApiError };
