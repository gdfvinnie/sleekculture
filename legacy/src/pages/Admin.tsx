import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  CheckCircle2,
  XCircle,
  Banknote,
  Pencil,
  Trash2,
  Plus,
  Search,
  Upload,
  X,
  Loader2,
  LogOut,
  LayoutDashboard,
  Shirt,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/context/CountryContext";
import {
  api,
  ApiError,
  type ApiAdmin,
  type ApiProduct,
  type ProductPayload,
} from "@/lib/api";

const PAGE_SIZE = 8;

const CATEGORIES = ["Hoodies", "T-Shirts", "Tank Tops", "Shorts", "Accessories"];
const SUBCATEGORIES = [
  "Heavyweight Fleece",
  "Midweight Fleece",
  "Jersey",
  "Cotton Twill",
  "T-Shirts",
  "Tank Tops",
  "Hoodies",
  "Shorts",
  "Caps",
];

export default function Admin() {
  // Session state resolves from the server; null = checked, not signed in.
  const [admin, setAdmin] = useState<ApiAdmin | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "products" | "add">("dashboard");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Resolve the session from the httpOnly cookie on mount
  useEffect(() => {
    api
      .me()
      .then((r) => setAdmin(r.admin))
      .catch(() => setAdmin(null))
      .finally(() => setChecking(false));
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setAdmin(null);
      setTab("dashboard");
      setEditingId(null);
    }
  }, []);

  // Auto-redirect hint: unauthenticated users see the login screen at /admin
  if (checking) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center pt-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!admin) {
    return (
      <AdminLogin
        onLogin={(a) => {
          setAdmin(a);
          setTab("dashboard");
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="px-4 py-8 sm:px-6 lg:px-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                SLEEKCULTURE
              </p>
              <h1 className="font-display text-4xl tracking-wide sm:text-5xl">
                ADMIN
              </h1>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {admin.email} · {admin.role}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> LOG OUT
            </Button>
          </div>

          {/* Sidebar — vertical on desktop, top tabs on mobile */}
          <div className="mb-8 flex flex-col gap-1 md:flex-row">
            <nav className="flex gap-1 overflow-x-auto border-b border-border md:w-52 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:pr-4">
              {(
                [
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "products", label: "Products", icon: Shirt },
                  { id: "add", label: "Add Product", icon: Plus },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (t.id === "add") setEditingId(null);
                    setTab(t.id);
                  }}
                  className={
                    tab === t.id
                      ? "flex shrink-0 items-center gap-2 bg-foreground px-4 py-3 font-display text-sm tracking-[0.15em] text-background"
                      : "flex shrink-0 items-center gap-2 px-4 py-3 font-display text-sm tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  <t.icon className="h-4 w-4" />
                  {t.label.toUpperCase()}
                </button>
              ))}
            </nav>

            <div className="flex-1 md:pl-8">
              {tab === "dashboard" && <DashboardTab />}
              {tab === "products" && (
                <ProductsTab
                  onEdit={(id) => {
                    setEditingId(id);
                    setTab("add");
                  }}
                  onSwitchToAdd={() => {
                    setEditingId(null);
                    setTab("add");
                  }}
                />
              )}
              {tab === "add" && (
                <ProductForm
                  key={editingId ?? "new"}
                  editingId={editingId}
                  onSaved={() => {
                    setEditingId(null);
                    setTab("products");
                  }}
                  onCancel={() => {
                    setEditingId(null);
                    setTab("products");
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- Login ---------------- */

function AdminLogin({ onLogin }: { onLogin: (admin: ApiAdmin) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { admin } = await api.login(email, password);
      onLogin(admin);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28">
        <div className="w-full max-w-md border border-border bg-card p-8 sm:p-10">
          <div className="mb-8 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center border border-border">
              <Lock className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-3xl tracking-widest">
              ADMIN ACCESS
            </h1>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
              Authorized personnel only
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sleekculture.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1.5"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> VERIFYING…
                </>
              ) : (
                "SIGN IN TO DASHBOARD"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Sessions are secured server-side and expire automatically. Failed
            attempts temporarily lock sign-in.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- Dashboard stats ---------------- */

function DashboardTab() {
  const { data: products = [] } = useProducts();
  const { formatPrice } = useCountry();

  const total = products.length;
  const inStock = products.filter((p) => p.inStock).length;
  const outOfStock = total - inStock;
  const inventoryValue = products.reduce(
    (sum, p) => sum + p.price * (p.quantity || 0),
    0,
  );
  const lowStock = products.filter(
    (p) => p.inStock && p.quantity > 0 && p.quantity <= 10,
  );

  const stats = [
    { label: "Total Products", value: String(total), icon: Package },
    { label: "In Stock", value: String(inStock), icon: CheckCircle2 },
    { label: "Out of Stock", value: String(outOfStock), icon: XCircle },
    { label: "Inventory Value", value: formatPrice(inventoryValue), icon: Banknote },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-border bg-card p-6">
            <s.icon className="mb-3 h-5 w-5 text-muted-foreground" />
            <p className="font-display text-4xl tracking-wide">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mt-6 border border-border bg-card p-6">
          <p className="font-display text-lg tracking-[0.1em]">LOW STOCK</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between gap-4">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 font-medium text-foreground">
                  {p.quantity} left
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Products table ---------------- */

function ProductsTab({
  onEdit,
  onSwitchToAdd,
}: {
  onEdit: (id: string) => void;
  onSwitchToAdd: () => void;
}) {
  const { data: products = [], isLoading } = useProducts();
  const { formatPrice } = useCountry();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"newest" | "price" | "name">("newest");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
    const numeric = (id: string) => parseInt(id, 10) || 0;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "price") cmp = a.price - b.price;
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else cmp = numeric(b.id) - numeric(a.id);
      return cmp * (sortKey === "newest" ? 1 : sortDir);
    });
  }, [products, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSort = (key: "newest" | "price" | "name") => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "newest" ? -1 : 1);
    }
  };

  const handleDelete = async (p: ApiProduct) => {
    if (!window.confirm(`Delete "${p.name}" from the store? This cannot be undone.`))
      return;
    setDeleting(p.id);
    setError(null);
    try {
      await api.deleteProduct(p.id);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Session expired — sign in again."
          : "Delete failed. Please try again.",
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
        </span>
        <Button size="sm" onClick={onSwitchToAdd} className="ml-auto">
          <Plus className="mr-1 h-4 w-4" /> ADD PRODUCT
        </Button>
      </div>

      {error && (
        <p className="mb-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-left">
              <th className="px-4 py-3 font-medium">Image</th>
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-accent"
                onClick={() => toggleSort("name")}
              >
                Name {sortKey === "name" && (sortDir === 1 ? "↑" : "↓")}
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-accent"
                onClick={() => toggleSort("price")}
              >
                Price {sortKey === "price" && (sortDir === 1 ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-accent"
                onClick={() => toggleSort("newest")}
              >
                Added {sortKey === "newest" && "↓"}
              </th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="h-14 w-11 border border-border object-cover"
                  />
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </td>
                <td className="px-4 py-3">
                  {formatPrice(p.price)}
                  {p.originalPrice ? (
                    <span className="ml-1.5 text-xs text-muted-foreground line-through">
                      {formatPrice(p.originalPrice)}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {p.inStock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" /> In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <XCircle className="h-3.5 w-3.5" /> Out of Stock
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{p.quantity}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">#{p.id}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(p.id)}
                      aria-label={`Edit ${p.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center border border-border transition-colors hover:border-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deleting === p.id}
                      aria-label={`Delete ${p.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center border border-destructive/40 text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                    >
                      {deleting === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No products match "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Page {safePage + 1} of {pageCount}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
            className="inline-flex h-9 w-9 items-center justify-center border border-border transition-colors hover:border-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            aria-label="Next page"
            className="inline-flex h-9 w-9 items-center justify-center border border-border transition-colors hover:border-foreground disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Add / Edit form ---------------- */

function ProductForm({
  editingId,
  onSaved,
  onCancel,
}: {
  editingId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { data: products = [] } = useProducts();
  const existing = products.find((p) => p.id === editingId);

  const [form, setForm] = useState(() => {
    if (!existing) {
      return {
        name: "",
        price: "",
        originalPrice: "",
        category: "Hoodies",
        subcategory: "Heavyweight Fleece",
        quantity: "10",
        inStock: true,
        sizes: "S, M, L, XL",
        colors: "Washed Black",
        images: [] as string[],
        description: "",
        isNew: false,
        isTrending: false,
      };
    }
    return {
      name: existing.name,
      price: String(existing.price),
      originalPrice: existing.originalPrice ? String(existing.originalPrice) : "",
      category: existing.category,
      subcategory: existing.subcategory,
      quantity: String(existing.quantity ?? 0),
      inStock: existing.inStock,
      sizes: existing.sizes.join(", "),
      colors: existing.colors.join(", "),
      images: [...existing.images],
      description: existing.description,
      isNew: existing.isNew,
      isTrending: existing.isTrending,
    };
  });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      const urls = await api.uploadImages(Array.from(files).slice(0, 6));
      setForm((f) => ({
        ...f,
        images: [...f.images, ...urls].slice(0, 8),
      }));
    } catch (err) {
      setMessage(
        err instanceof ApiError
          ? err.message
          : "Upload failed. Files must be images under 2MB.",
      );
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = (): ProductPayload => ({
    name: form.name.trim(),
    price: Number(form.price),
    originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
    category: form.category,
    subcategory: form.subcategory,
    quantity: Number(form.quantity) || 0,
    inStock: form.inStock,
    sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean),
    images: form.images,
    description: form.description.trim(),
    isNew: form.isNew,
    isTrending: form.isTrending,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (editingId) {
        await api.updateProduct(editingId, buildPayload());
      } else {
        await api.createProduct(buildPayload());
      }
      onSaved();
    } catch (err) {
      setMessage(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-[0.1em]">
          {editingId ? "EDIT PRODUCT" : "ADD PRODUCT"}
        </h2>
        {editingId && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="mr-1 h-4 w-4" /> CANCEL EDIT
          </Button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="p-name">Product name *</Label>
          <Input
            id="p-name"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="p-price">Price *</Label>
          <Input
            id="p-price"
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="p-original">Original price (for sale badge)</Label>
          <Input
            id="p-original"
            type="number"
            min="0"
            step="0.01"
            value={form.originalPrice}
            onChange={(e) => set("originalPrice", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Subcategory</Label>
          <Select value={form.subcategory} onValueChange={(v) => set("subcategory", v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBCATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p-qty">Quantity</Label>
          <Input
            id="p-qty"
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <Switch id="p-stock" checked={form.inStock} onCheckedChange={(v) => set("inStock", v)} />
          <Label htmlFor="p-stock">{form.inStock ? "In Stock" : "Out of Stock"}</Label>
        </div>
        <div>
          <Label htmlFor="p-sizes">Sizes (comma-separated) *</Label>
          <Input
            id="p-sizes"
            value={form.sizes}
            onChange={(e) => set("sizes", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="p-colors">Colors (comma-separated) *</Label>
          <Input
            id="p-colors"
            value={form.colors}
            onChange={(e) => set("colors", e.target.value)}
            className="mt-1.5"
          />
        </div>

        {/* Images */}
        <div className="sm:col-span-2">
          <Label>Product images ({form.images.length}/8) *</Label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 border border-border px-4 text-sm transition-colors hover:border-foreground">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "UPLOADING…" : "UPLOAD"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const url = window.prompt("Paste image URL");
                if (url && url.trim()) set("images", [...form.images, url.trim()]);
              }}
            >
              ADD URL
            </Button>
          </div>

          {form.images.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {form.images.map((img, i) => (
                <div key={img + i} className="relative aspect-[3/4] overflow-hidden border border-border">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      set("images", form.images.filter((_, idx) => idx !== i))
                    }
                    aria-label="Remove image"
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center bg-background/90 text-foreground hover:bg-destructive hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-background/90 px-1.5 py-0.5 text-[9px] uppercase tracking-widest">
                      Front
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            First image is the storefront front view. Uploads go to the project
            server (JPEG, PNG, WebP, AVIF — max 2MB each).
          </p>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="p-desc">Description / product details *</Label>
          <Textarea
            id="p-desc"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch id="p-new" checked={form.isNew} onCheckedChange={(v) => set("isNew", v)} />
          <Label htmlFor="p-new">New arrival</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="p-trend" checked={form.isTrending} onCheckedChange={(v) => set("isTrending", v)} />
          <Label htmlFor="p-trend">Trending</Label>
        </div>
      </div>

      {message && (
        <p className="mt-5 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> SAVING…
            </>
          ) : editingId ? (
            "SAVE CHANGES"
          ) : (
            "ADD TO STORE"
          )}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            CANCEL
          </Button>
        )}
      </div>
    </form>
  );
}
