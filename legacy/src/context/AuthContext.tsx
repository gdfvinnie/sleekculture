import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Customer account context — backed by the project's own API. The session
 * lives in an httpOnly cookie, so this context simply resolves it on load
 * and exposes login/register/logout. Admin auth is entirely separate
 * (server/admin + /admin page).
 */

export interface AccountUser {
  email: string;
  name: string | null;
  memberSince?: string;
}

interface AuthContextValue {
  user: AccountUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg) return msg;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/me", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AccountUser };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  // Resolve the session once on load — persists across reloads via cookie
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch("/api/account/login", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await res.json()) as {
          user?: AccountUser;
          error?: string;
        };
        if (!res.ok) return { error: data.error ?? "Sign in failed." };
        setUser(data.user ?? null);
        return {};
      } catch {
        return { error: errorMessage({}, "Could not reach the server. Please try again.") };
      }
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const res = await fetch("/api/account/register", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = (await res.json()) as {
          user?: AccountUser;
          error?: string;
        };
        if (!res.ok) return { error: data.error ?? "Registration failed." };
        setUser(data.user ?? null);
        return {};
      } catch {
        return { error: errorMessage({}, "Could not reach the server. Please try again.") };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/account/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin: false, signIn, register, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
