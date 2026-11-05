/**
 * Frontend API client for the sleekculture backend.
 * Credentials never touch this code — the server verifies against the
 * database and sets an httpOnly session cookie.
 */

export interface ApiAdmin {
  email: string;
  role: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  isTrending: boolean;
  inStock: boolean;
  quantity: number;
}

export interface ProductPayload {
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  quantity: number;
  inStock: boolean;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  isNew: boolean;
  isTrending: boolean;
}

class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin", // send the httpOnly session cookie
    headers:
      init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : undefined,
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let fieldErrors: Record<string, string> | undefined;
    try {
      const data = (await res.json()) as {
        error?: string;
        errors?: { field: string; message: string }[];
      };
      if (data.error) message = data.error;
      if (data.errors) {
        fieldErrors = Object.fromEntries(data.errors.map((e) => [e.field, e.message]));
        message = data.errors[0]?.message ?? message;
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message, fieldErrors);
  }

  return (await res.json()) as T;
}

/* ---------------- Auth ---------------- */

export const api = {
  login: (email: string, password: string) =>
    request<{ admin: ApiAdmin }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  me: () => request<{ admin: ApiAdmin }>("/api/auth/me"),

  /* ---------------- Products ---------------- */

  products: () => request<ApiProduct[]>("/api/products"),

  createProduct: (payload: ProductPayload) =>
    request<ApiProduct>("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: string, payload: ProductPayload) =>
    request<ApiProduct>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: string) =>
    request<{ ok: true }>(`/api/products/${id}`, { method: "DELETE" }),

  uploadImages: async (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    const data = await request<{ urls: string[] }>("/api/upload", {
      method: "POST",
      body: form,
    });
    return data.urls;
  },
};

export { ApiError };
