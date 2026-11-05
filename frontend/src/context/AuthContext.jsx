"use strict";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
const AuthContext = createContext(void 0);
const localStorage = window.localStorage;
const sessionStorage = window.sessionStorage;
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);
  const bootstrapped = useRef(false);
  const scheduleRefresh = useCallback((maxAgeSeconds) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const delay = Math.max(
      6e4,
      Math.floor(maxAgeSeconds * 0.85) * 1e3
    );
    refreshTimer.current = setTimeout(refresh, delay);
  }, []);
  async function refresh() {
    try {
      const res = await fetch("/api/account/me", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setUser(data.user);
      scheduleRefresh(30 * 24 * 60 * 60);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }
  const [savedLogin, setSavedLogin] = useState(() => {
    try {
      const raw = localStorage.getItem("sc-remembered-login");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    refresh();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);
  const signIn = useCallback(
    async (email, password, remember) => {
      const res = await fetch("/api/account/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error ?? "Something went wrong. Please try again." };
      }
      setUser(data.user);
      if (remember) {
        try {
          localStorage.setItem("sc-remembered-login", JSON.stringify({ email }));
        } catch {}
      }
      scheduleRefresh(30 * 24 * 60 * 60);
      return { ok: true, user: data.user };
    },
    [scheduleRefresh]
  );
  const signUp = useCallback(
    async (email, password, name, remember) => {
      const res = await fetch("/api/account/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error ?? "Registration failed. Please try again." };
      }
      setUser(data.user);
      if (remember) {
        try {
          localStorage.setItem("sc-remembered-login", JSON.stringify({ email }));
        } catch {}
      }
      scheduleRefresh(30 * 24 * 60 * 60);
      return { ok: true, user: data.user };
    },
    [scheduleRefresh]
  );
  const signOut = useCallback(async () => {
    try {
      await fetch("/api/account/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch {}
    setUser(null);
    try {
      localStorage.removeItem("sc-remembered-login");
    } catch {}
  }, []);
  const attachUserToOrder = useCallback(async (order) => {
    if (!user || !order?.id) return;
    try {
      await fetch(`/api/orders/${order.id}/attach`, {
        method: "POST",
        credentials: "include"
      });
    } catch {}
  }, [user]);
  const value = useMemo(
    () => ({ user, loading, refresh, signIn, signUp, signOut, savedLogin, attachUserToOrder }),
    [user, loading, refresh, signIn, signUp, signOut, savedLogin, attachUserToOrder]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
