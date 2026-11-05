"use strict";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  LogOut,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  RotateCcw,
  Menu as MenuIcon,
  DollarSign,
  RefreshCw,
  KeyRound,
  Store
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
  SelectValue
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/context/CountryContext";
import { api, ApiError } from "@/lib/api";

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
  "Caps"
];

const NAV_SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings }
];

const STATUS_BADGES = {
  processing: { label: "Processing", cls: "bg-amber-100 text-amber-800", icon: Clock },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  shipped: { label: "Shipped", cls: "bg-blue-100 text-blue-800", icon: Truck },
  delivered: { label: "Delivered", cls: "bg-green-700 text-white", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-800", icon: XCircle },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800", icon: Clock },
  succeeded: { label: "Paid", cls: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  failed: { label: "Failed", cls: "bg-red-100 text-red-800", icon: XCircle },
  refunded: { label: "Refunded", cls: "bg-gray-200 text-gray-700", icon: RotateCcw }
};
function StatusBadge({ value }) {
  const cfg = STATUS_BADGES[value] || { label: value, cls: "bg-secondary text-secondary-foreground", icon: Clock };
  const Icon = cfg.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cfg.cls}`}><Icon className="h-3 w-3" />{cfg.label}</span>;
}
function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function Admin() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [editingId, setEditingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.me().then((r) => setAdmin(r.admin)).catch(() => setAdmin(null)).finally(() => setChecking(false));
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      queryClient.clear();
      setAdmin(null);
      setTab("dashboard");
      setEditingId(null);
    }
  }, [queryClient]);

  const refreshStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
  }, [queryClient]);

  if (checking) {
    return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex flex-1 items-center justify-center pt-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></main><Footer /></div>;
  }
  if (!admin) {
    return <AdminLogin onLogin={(a) => { setAdmin(a); setTab("dashboard"); }} />;
  }

  const openProductForm = (id) => {
    setEditingId(id ?? null);
    setTab("add");
    setSidebarOpen(false);
  };

  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex flex-1 pt-16">
    {/* Desktop sidebar */}
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Sleekculture</p>
        {NAV_SECTIONS.map((t) => <button
          key={t.id}
          onClick={() => setTab(t.id)}
          aria-current={tab === t.id ? "page" : undefined}
          className={tab === t.id
            ? "mb-1 flex w-full items-center gap-3 bg-foreground px-3 py-2.5 text-sm font-medium text-background"
            : "mb-1 flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"}
        ><t.icon className="h-4 w-4" />{t.label}</button>)}
        <div className="my-3 border-t border-border" />
        <button
          onClick={() => openProductForm(null)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        ><Plus className="h-4 w-4" />Add product</button>
      </nav>
      <div className="border-t border-border p-3">
        <p className="truncate px-3 text-xs text-muted-foreground">{admin.email}</p>
        <button onClick={handleSignOut} className="mt-1 flex w-full items-center gap-3 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive"><LogOut className="h-4 w-4" />Sign out</button>
      </div>
    </aside>

    {/* Content */}
    <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Mobile top nav */}
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <button onClick={() => setSidebarOpen(true)} aria-label="Open admin menu" className="inline-flex h-10 w-10 items-center justify-center border border-border"><MenuIcon className="h-5 w-5" /></button>
        <p className="font-display text-xl tracking-widest">ADMIN</p>
        <button onClick={handleSignOut} aria-label="Sign out" className="inline-flex h-10 w-10 items-center justify-center border border-border text-muted-foreground hover:text-destructive"><LogOut className="h-4 w-4" /></button>
      </div>
      <h1 className="mb-6 hidden font-display text-3xl tracking-wide lg:block">{NAV_SECTIONS.find((t) => t.id === tab)?.label || "Add Product"}<span className="ml-3 align-middle text-sm font-body uppercase tracking-widest text-muted-foreground">{admin.email}</span></h1>

      {tab === "dashboard" && <DashboardTab onGoTo={setTab} refreshStats={refreshStats} />}
      {tab === "products" && <ProductsTab onEdit={openProductForm} />}
      {tab === "add" && <ProductForm
        key={editingId ?? "new"}
        editingId={editingId}
        onSaved={() => { setEditingId(null); setTab("products"); }}
        onCancel={() => { setEditingId(null); setTab("products"); }}
      />}
      {tab === "orders" && <OrdersTab onChanged={refreshStats} />}
      {tab === "customers" && <CustomersTab />}
      {tab === "payments" && <PaymentsTab onChanged={refreshStats} />}
      {tab === "settings" && <SettingsTab />}
    </div>
  </main>
    {/* Mobile drawer */}
    {sidebarOpen && <>
      <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-border px-4"><span className="font-display text-lg tracking-widest">ADMIN</span><button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="p-2"><X className="h-5 w-5" /></button></div>
        <nav className="flex-1 overflow-y-auto p-3">{NAV_SECTIONS.map((t) => <button
          key={t.id}
          onClick={() => { setTab(t.id); setSidebarOpen(false); }}
          className={tab === t.id ? "mb-1 flex w-full items-center gap-3 bg-foreground px-3 py-2.5 text-sm font-medium text-background" : "mb-1 flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground"}
        ><t.icon className="h-4 w-4" />{t.label}</button>)}
          <div className="my-3 border-t border-border" />
          <button onClick={() => openProductForm(null)} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground"><Plus className="h-4 w-4" />Add product</button>
        </nav>
      </aside>
    </>}
  </div>;
}

/* ------------------------------------------------------------------ Login */

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { admin } = await api.login(email, password);
      onLogin(admin);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28"><div className="w-full max-w-md border border-border bg-card p-8 sm:p-10"><div className="mb-8 text-center"><span className="inline-flex h-12 w-12 items-center justify-center border border-border"><Lock className="h-5 w-5" /></span><h1 className="mt-4 font-display text-3xl tracking-widest">ADMIN ACCESS</h1><p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Authorized personnel only</p></div><form onSubmit={submit} className="space-y-4"><div><Label htmlFor="admin-email">Email</Label><Input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@sleekculture.com" className="mt-1.5" /></div><div><Label htmlFor="admin-password">Password</Label><Input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="mt-1.5" /></div>{error && <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> VERIFYING…</> : "SIGN IN TO DASHBOARD"}</Button></form><p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">Sessions are secured server-side and expire automatically. Failed attempts temporarily lock sign-in.</p></div></main><Footer /></div>;
}

/* --------------------------------------------------------------- Dashboard */

function DashboardTab({ onGoTo, refreshStats }) {
  const { formatPrice } = useCountry();
  const { data: stats, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["adminStats"],
    queryFn: api.adminStats,
    refetchInterval: 60000
  });

  if (isLoading) return <CenterSpinner />;
  if (isError || !stats) return <ErrorNote message="Could not load dashboard stats." onRetry={refetch} />;

  const statCards = [
    { label: "Total sales", value: formatPrice(stats.totalSales), icon: DollarSign, cls: "text-emerald-600" },
    { label: "Total orders", value: String(stats.totalOrders), icon: ShoppingBag, cls: "" },
    { label: "Pending orders", value: String(stats.pendingOrders), icon: Clock, cls: "text-amber-600" },
    { label: "Customers", value: String(stats.customers), icon: Users, cls: "" }
  ];

  return <div>
    <div className="mb-4 flex items-center justify-between">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Overview · updates every minute</p>
      <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}><RefreshCw className={`mr-1 h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} /> Refresh</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((s) => <div key={s.label} className="border border-border bg-card p-5">
        <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p><s.icon className={`h-4 w-4 ${s.cls}`} /></div>
        <p className="mt-2 font-display text-3xl tracking-wide">{s.value}</p>
      </div>)}
    </div>

    <div className="mt-6 flex flex-wrap gap-3">
      <Button variant="outline" size="sm" onClick={() => onGoTo("orders")}><ShoppingBag className="mr-1 h-4 w-4" /> View orders</Button>
      <Button variant="outline" size="sm" onClick={() => onGoTo("products")}><Package className="mr-1 h-4 w-4" /> Manage products</Button>
    </div>

    <div className="mt-6 border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="font-display text-sm tracking-[0.15em]">RECENT ORDERS</p><button onClick={() => onGoTo("orders")} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">View all →</button></div>
      <div className="divide-y divide-border">{stats.recentOrders.map((o) => <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
        <div className="min-w-0"><p className="truncate font-medium">{o.orderNumber}</p><p className="truncate text-xs text-muted-foreground">{o.customerName || o.customerEmail || "Guest"} · {fmtDate(o.createdAt)}</p></div>
        <div className="flex items-center gap-3"><StatusBadge value={o.status} /><span className="font-semibold">{formatPrice(o.total)}</span></div>
      </div>)}
      {stats.recentOrders.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
    {stats.refundedOrders > 0 && <p className="mt-3 text-xs text-muted-foreground">{stats.refundedOrders} refunded order{stats.refundedOrders === 1 ? "" : "s"} · see <button onClick={() => onGoTo("payments")} className="underline underline-offset-2 hover:text-foreground">Payments</button></p>}
  </div>;
}

/* ----------------------------------------------------------------- Orders */

function OrdersTab({ onChanged }) {
  const { formatPrice } = useCountry();
  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: api.adminOrders
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all") {
        if (statusFilter === "open" && !(o.status === "processing" || o.paymentStatus === "pending" || o.paymentStatus === "failed")) return false;
        if (statusFilter === "open") return true;
        if (o.status !== statusFilter) return false;
      }
      if (!q) return true;
      return (o.orderNumber || "").toLowerCase().includes(q)
        || (o.customerName || "").toLowerCase().includes(q)
        || (o.customerEmail || "").toLowerCase().includes(q);
    });
  }, [orders, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const update = async (o, patch) => {
    setBusyId(o.id);
    setError(null);
    try {
      await api.adminUpdateOrder(o.id, patch);
      await refetch();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <CenterSpinner />;
  if (isError) return <ErrorNote message="Could not load orders." onRetry={refetch} />;

  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative max-w-xs flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search order #, name, email…" className="pl-9" /></div>
      <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="all">All orders</SelectItem>
        <SelectItem value="open">Needs attention</SelectItem>
        <SelectItem value="processing">Processing</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
        <SelectItem value="shipped">Shipped</SelectItem>
        <SelectItem value="delivered">Delivered</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
      </SelectContent></Select>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{filtered.length} order{filtered.length === 1 ? "" : "s"}</span>
    </div>
    {error && <p className="mb-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-border bg-secondary/60 text-left">
          <th className="px-4 py-3 font-medium">Order</th>
          <th className="px-4 py-3 font-medium">Customer</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Payment</th>
          <th className="px-4 py-3 font-medium">Total</th>
          <th className="px-4 py-3 text-right font-medium">Actions</th>
        </tr></thead>
        <tbody>
          {pageItems.map((o) => <>
            <tr key={o.id} className="border-b border-border">
              <td className="px-4 py-3"><button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="text-left font-medium underline-offset-2 hover:underline">{o.orderNumber}</button><p className="text-xs text-muted-foreground">{fmtDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}</p></td>
              <td className="max-w-[200px] px-4 py-3"><p className="truncate">{o.customerName || "Guest"}</p><p className="truncate text-xs text-muted-foreground">{o.customerEmail}</p></td>
              <td className="px-4 py-3"><StatusBadge value={o.status} /></td>
              <td className="px-4 py-3"><StatusBadge value={o.paymentStatus} /></td>
              <td className="px-4 py-3 font-semibold">{formatPrice(o.total)}</td>
              <td className="px-4 py-3"><div className="flex justify-end"><Select value={o.status} onValueChange={(v) => update(o, { status: v })} disabled={busyId === o.id}><SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger><SelectContent>
                {["processing", "paid", "shipped", "delivered", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent></Select></div></td>
            </tr>
            {expanded === o.id && <tr key={o.id + "-detail"} className="border-b border-border bg-secondary/40"><td colSpan={6} className="px-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Items</p><ul className="space-y-1 text-sm">{(o.itemsSummary || "").split(", ").filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}<li className="text-muted-foreground">Subtotal, shipping & taxes as charged at checkout.</li></ul></div>
                <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Shipping</p>
                  <p className="text-sm">{o.shipping?.fullName || "—"}{o.shipping?.phone ? <> · {o.shipping.phone}</> : null}</p>
                  <p className="text-sm text-muted-foreground">{[o.shipping?.address, o.shipping?.city, o.shipping?.state, o.shipping?.country, o.shipping?.postalCode].filter(Boolean).join(", ") || "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Payment:</span>
                {o.paymentStatus !== "succeeded" && o.paymentStatus !== "refunded" && <Button size="sm" variant="outline" onClick={() => update(o, { paymentStatus: "succeeded" })} disabled={busyId === o.id}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark paid</Button>}
                {o.paymentStatus !== "failed" && o.paymentStatus !== "refunded" && <Button size="sm" variant="outline" onClick={() => update(o, { paymentStatus: "refunded" })} disabled={busyId === o.id}><RotateCcw className="mr-1 h-3.5 w-3.5" /> Refund</Button>}
                {busyId === o.id && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </td></tr>}
          </>)}
          {pageItems.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No orders match your filters.</td></tr>}
        </tbody>
      </table>
    </div>
    {pageCount > 1 && <Pager page={safePage} pageCount={pageCount} setPage={setPage} />}
  </div>;
}

/* --------------------------------------------------------------- Customers */

function CustomersTab() {
  const { formatPrice } = useCountry();
  const { data: customers = [], isLoading, isError, refetch } = useQuery({ queryKey: ["adminCustomers"], queryFn: api.adminCustomers });
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q));
  }, [customers, query]);

  const { data: detail } = useQuery({
    queryKey: ["adminCustomer", selected],
    queryFn: () => api.adminCustomer(selected),
    enabled: !!selected && !String(selected).startsWith("guest-")
  });
  const selectedSummary = customers.find((c) => c.id === selected);

  if (isLoading) return <CenterSpinner />;
  if (isError) return <ErrorNote message="Could not load customers." onRetry={refetch} />;

  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative max-w-xs flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="pl-9" /></div>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{filtered.length} customer{filtered.length === 1 ? "" : "s"}</span>
    </div>
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead><tr className="border-b border-border bg-secondary/60 text-left">
          <th className="px-4 py-3 font-medium">Customer</th>
          <th className="px-4 py-3 font-medium">Member since</th>
          <th className="px-4 py-3 font-medium">Orders</th>
          <th className="px-4 py-3 font-medium">Total spend</th>
          <th className="px-4 py-3 text-right font-medium">History</th>
        </tr></thead>
        <tbody>
          {filtered.map((c) => <tr key={c.id} className="border-b border-border last:border-b-0">
            <td className="px-4 py-3"><p className="font-medium">{c.name || "Guest"}</p><p className="text-xs text-muted-foreground">{c.email}{c.id.startsWith("guest-") ? " · guest" : ""}</p></td>
            <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.memberSince)}</td>
            <td className="px-4 py-3">{c.orderCount}</td>
            <td className="px-4 py-3 font-semibold">{formatPrice(c.totalSpend)}</td>
            <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setSelected(c.id)}>View</Button></td>
          </tr>)}
          {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No customers found.</td></tr>}
        </tbody>
      </table>
    </div>

    {selected && <CustomerDetail id={selected} summary={selectedSummary} detail={detail} onClose={() => setSelected(null)} formatPrice={formatPrice} />}
  </div>;
}

function CustomerDetail({ id, summary, detail, onClose, formatPrice }) {
  const c = detail || summary;
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}><div className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-background p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
    <div className="mb-6 flex items-start justify-between"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Customer</p><h2 className="mt-1 font-display text-2xl tracking-wide">{c?.name || "Guest"}</h2><p className="text-sm text-muted-foreground">{c?.email}</p></div><button onClick={onClose} aria-label="Close" className="p-2 hover:text-destructive"><X className="h-5 w-5" /></button></div>
    {c && <><div className="grid grid-cols-3 gap-3">
      <div className="border border-border bg-card p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Member since</p><p className="mt-1 text-sm">{fmtDate(c.memberSince)}</p></div>
      <div className="border border-border bg-card p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Orders</p><p className="mt-1 font-display text-xl">{c.orderCount}</p></div>
      <div className="border border-border bg-card p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Spend</p><p className="mt-1 text-sm font-semibold">{formatPrice(c.totalSpend)}</p></div>
    </div>
    <p className="mt-6 mb-2 font-display text-sm tracking-[0.15em]">ORDER HISTORY</p>
    {detail?.orders?.length ? <div className="divide-y divide-border border border-border bg-card">{detail.orders.map((o) => <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <div><p className="font-medium">{o.orderNumber}</p><p className="text-xs text-muted-foreground">{fmtDate(o.createdAt)}</p></div>
      <div className="flex items-center gap-3"><StatusBadge value={o.status} /><StatusBadge value={o.paymentStatus} /><span className="font-semibold">{formatPrice(o.total)}</span></div>
    </div>)}</div> : <p className="border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">{c.id.startsWith("guest-") ? "Guest checkout — sign in to view full history." : "No orders yet."}</p>}
    </>}
    {!detail && !c?.id?.startsWith("guest-") && <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading full history…</p>}
  </div></div>;
}

/* ---------------------------------------------------------------- Payments */

function PaymentsTab({ onChanged }) {
  const { formatPrice } = useCountry();
  const { data: orders = [], isLoading, isError, refetch } = useQuery({ queryKey: ["adminOrders"], queryFn: api.adminOrders });
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "refunds") return orders.filter((o) => o.paymentStatus === "refunded");
    return orders.filter((o) => o.paymentStatus === filter);
  }, [orders, filter]);

  const totals = useMemo(() => {
    const cleared = orders.filter((o) => ["paid", "succeeded"].includes(o.paymentStatus)).reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => o.paymentStatus === "pending").reduce((s, o) => s + o.total, 0);
    const refunded = orders.filter((o) => o.paymentStatus === "refunded").reduce((s, o) => s + o.total, 0);
    return { cleared, pending, refunded };
  }, [orders]);

  const update = async (o, patch) => {
    setBusyId(o.id);
    setError(null);
    try {
      await api.adminUpdateOrder(o.id, patch);
      await refetch();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <CenterSpinner />;
  if (isError) return <ErrorNote message="Could not load payments." onRetry={refetch} />;

  return <div>
    <div className="mb-4 grid gap-4 sm:grid-cols-3">
      <div className="border border-border bg-card p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Collected</p><p className="mt-1 font-display text-2xl">{formatPrice(totals.cleared)}</p></div>
      <div className="border border-border bg-card p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Pending</p><p className="mt-1 font-display text-2xl">{formatPrice(totals.pending)}</p></div>
      <div className="border border-border bg-card p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Refunded</p><p className="mt-1 font-display text-2xl">{formatPrice(totals.refunded)}</p></div>
    </div>

    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="all">All payments</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
        <SelectItem value="succeeded">Succeeded</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
        <SelectItem value="refunds">Refunded</SelectItem>
      </SelectContent></Select>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{filtered.length} transaction{filtered.length === 1 ? "" : "s"}</span>
    </div>
    {error && <p className="mb-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[680px] text-sm">
        <thead><tr className="border-b border-border bg-secondary/60 text-left">
          <th className="px-4 py-3 font-medium">Order</th>
          <th className="px-4 py-3 font-medium">Customer</th>
          <th className="px-4 py-3 font-medium">Method</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Amount</th>
          <th className="px-4 py-3 text-right font-medium">Actions</th>
        </tr></thead>
        <tbody>
          {filtered.slice(0, 50).map((o) => <tr key={o.id} className="border-b border-border last:border-b-0">
            <td className="px-4 py-3"><p className="font-medium">{o.orderNumber}</p><p className="text-xs text-muted-foreground">{fmtDate(o.createdAt)}</p></td>
            <td className="max-w-[180px] px-4 py-3"><p className="truncate">{o.customerName || "Guest"}</p><p className="truncate text-xs text-muted-foreground">{o.customerEmail}</p></td>
            <td className="px-4 py-3 capitalize">{(o.paymentMethod || "").replace("_", " ")}</td>
            <td className="px-4 py-3"><StatusBadge value={o.paymentStatus} /></td>
            <td className="px-4 py-3 font-semibold">{formatPrice(o.total)}</td>
            <td className="px-4 py-3"><div className="flex justify-end gap-2">
              {!["succeeded", "refunded", "paid"].includes(o.paymentStatus) && <Button size="sm" variant="outline" onClick={() => update(o, { paymentStatus: "succeeded" })} disabled={busyId === o.id}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark paid</Button>}
              {o.paymentStatus !== "refunded" && o.paymentStatus !== "failed" && <Button size="sm" variant="outline" onClick={() => update(o, { paymentStatus: "refunded" })} disabled={busyId === o.id}><RotateCcw className="mr-1 h-3.5 w-3.5" /> Refund</Button>}
              {busyId === o.id && <Loader2 className="h-4 w-4 animate-spin" />}
            </div></td>
          </tr>)}
          {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No transactions match this filter.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}

/* ---------------------------------------------------------------- Settings */

function SettingsTab() {
  const { data: settings, isLoading, isError } = useQuery({ queryKey: ["adminSettings"], queryFn: api.adminSettings });
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => { if (settings && form === null) setForm({ ...settings }); }, [settings, form]);

  if (isLoading || !form) return <CenterSpinner />;
  if (isError) return <ErrorNote message="Could not load settings." onRetry={() => window.location.reload()} />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await api.adminUpdateSettings(form);
      setForm({ ...saved });
      setMessage({ ok: true, text: "Store settings saved." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setPwBusy(true);
    try {
      await api.adminChangePassword(pwForm.current, pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      setPwMsg({ ok: true, text: "Password updated." });
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof ApiError ? err.message : "Change failed." });
    } finally {
      setPwBusy(false);
    }
  };

  return <div className="max-w-2xl space-y-8">
    <section className="border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2"><Store className="h-4 w-4 text-muted-foreground" /><h2 className="font-display text-xl tracking-[0.1em]">STORE</h2></div>
      <form onSubmit={saveStore} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="st-name">Store name</Label><Input id="st-name" value={form.storeName} onChange={(e) => set("storeName", e.target.value)} className="mt-1.5" /></div>
        <div><Label htmlFor="st-email">Support email</Label><Input id="st-email" type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} className="mt-1.5" /></div>
        <div><Label htmlFor="st-phone">Support phone</Label><Input id="st-phone" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} className="mt-1.5" /></div>
        <div><Label htmlFor="st-free">Free shipping over ($)</Label><Input id="st-free" type="number" min="0" step="0.01" value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} className="mt-1.5" /></div>
        <div><Label htmlFor="st-fee">Shipping fee ($)</Label><Input id="st-fee" type="number" min="0" step="0.01" value={form.shippingFee} onChange={(e) => set("shippingFee", e.target.value)} className="mt-1.5" /></div>
        {message && <p className={`sm:col-span-2 px-3 py-2 text-sm ${message.ok ? "border border-emerald-300/40 bg-emerald-50 text-emerald-800" : "border border-destructive/30 bg-destructive/5 text-destructive"}`}>{message.text}</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save store settings"}</Button></div>
      </form>
    </section>

    <section className="border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground" /><h2 className="font-display text-xl tracking-[0.1em]">ADMIN ACCOUNT</h2></div>
      <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="pw-current">Current password</Label><Input id="pw-current" type="password" autoComplete="current-password" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} className="mt-1.5" /></div>
        <div><Label htmlFor="pw-next">New password</Label><Input id="pw-next" type="password" autoComplete="new-password" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} className="mt-1.5" /></div>
        <div><Label htmlFor="pw-confirm">Confirm new password</Label><Input id="pw-confirm" type="password" autoComplete="new-password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} className="mt-1.5" /></div>
        {pwMsg && <p className={`sm:col-span-2 px-3 py-2 text-sm ${pwMsg.ok ? "border border-emerald-300/40 bg-emerald-50 text-emerald-800" : "border border-destructive/30 bg-destructive/5 text-destructive"}`}>{pwMsg.text}</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={pwBusy}>{pwBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Change password"}</Button></div>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Sessions stay signed in after a password change; sign out manually on shared machines.</p>
    </section>
  </div>;
}

/* ------------------------------------------------------- Products + shared */

function ProductsTab({ onEdit }) {
  const { data: products = [], isLoading } = useProducts();
  const { formatPrice } = useCountry();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const [sortDir, setSortDir] = useState(-1);
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    const numeric = (id) => parseInt(id, 10) || 0;
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
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 1 ? -1 : 1);
    else { setSortKey(key); setSortDir(key === "newest" ? -1 : 1); }
  };
  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}" from the store? This cannot be undone.`)) return;
    setDeleting(p.id);
    setError(null);
    try {
      await api.deleteProduct(p.id);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Session expired — sign in again." : "Delete failed. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search products…" className="pl-9" /></div>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{filtered.length} item{filtered.length === 1 ? "" : "s"}</span>
      <Button size="sm" onClick={() => onEdit(null)} className="ml-auto"><Plus className="mr-1 h-4 w-4" /> ADD PRODUCT</Button>
    </div>
    {error && <p className="mb-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-border bg-secondary/60 text-left">
          <th className="px-4 py-3 font-medium">Image</th>
          <th className="cursor-pointer px-4 py-3 font-medium hover:text-accent" onClick={() => toggleSort("name")}>Name {sortKey === "name" && (sortDir === 1 ? "↑" : "↓")}</th>
          <th className="cursor-pointer px-4 py-3 font-medium hover:text-accent" onClick={() => toggleSort("price")}>Price {sortKey === "price" && (sortDir === 1 ? "↑" : "↓")}</th>
          <th className="px-4 py-3 font-medium">Stock</th>
          <th className="px-4 py-3 font-medium">Qty</th>
          <th className="cursor-pointer px-4 py-3 font-medium hover:text-accent" onClick={() => toggleSort("newest")}>Added {sortKey === "newest" && "↓"}</th>
          <th className="px-4 py-3 text-right font-medium">Actions</th>
        </tr></thead>
        <tbody>
          {pageItems.map((p) => <tr key={p.id} className="border-b border-border last:border-b-0">
            <td className="px-4 py-3"><img src={p.images[0]} alt={p.name} loading="lazy" className="h-14 w-11 border border-border object-cover" /></td>
            <td className="max-w-[220px] px-4 py-3"><p className="truncate font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></td>
            <td className="px-4 py-3">{formatPrice(p.price)}{p.originalPrice ? <span className="ml-1.5 text-xs text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span> : null}</td>
            <td className="px-4 py-3">{p.inStock ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> In Stock</span> : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive"><XCircle className="h-3.5 w-3.5" /> Out of Stock</span>}</td>
            <td className="px-4 py-3">{p.quantity}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">#{p.id}</td>
            <td className="px-4 py-3"><div className="flex justify-end gap-1">
              <button onClick={() => onEdit(p.id)} aria-label={`Edit ${p.name}`} className="inline-flex h-8 w-8 items-center justify-center border border-border transition-colors hover:border-foreground"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => handleDelete(p)} disabled={deleting === p.id} aria-label={`Delete ${p.name}`} className="inline-flex h-8 w-8 items-center justify-center border border-destructive/40 text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50">{deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
            </div></td>
          </tr>)}
          {pageItems.length === 0 && !isLoading && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No products match "{query}".</td></tr>}
        </tbody>
      </table>
    </div>
    <Pager page={safePage} pageCount={pageCount} setPage={setPage} />
  </div>;
}

function Pager({ page, pageCount, setPage }) {
  if (pageCount <= 1) return null;
  return <div className="mt-4 flex items-center justify-between">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">Page {page + 1} of {pageCount}</p>
    <div className="flex gap-1">
      <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous page" className="inline-flex h-9 w-9 items-center justify-center border border-border transition-colors hover:border-foreground disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
      <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} aria-label="Next page" className="inline-flex h-9 w-9 items-center justify-center border border-border transition-colors hover:border-foreground disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
    </div>
  </div>;
}

function CenterSpinner() {
  return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
}
function ErrorNote({ message, onRetry }) {
  return <div className="border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
    <p>{message}</p>
    {onRetry && <button onClick={onRetry} className="mt-2 underline underline-offset-2">Retry</button>}
  </div>;
}

function ProductForm({ editingId, onSaved, onCancel }) {
  const { data: products = [] } = useProducts();
  const existing = products.find((p) => p.id === editingId);
  const [form, setForm] = useState(() => {
    if (!existing) {
      return {
        name: "", price: "", originalPrice: "", category: "Hoodies",
        subcategory: "Heavyweight Fleece", quantity: "10", inStock: true,
        sizes: "S, M, L, XL", colors: "Washed Black", images: [], description: "",
        isNew: false, isTrending: false
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
      isTrending: existing.isTrending
    };
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const onUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      const urls = await api.uploadImages(Array.from(files).slice(0, 6));
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 8) }));
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Upload failed. Files must be images under 2MB.");
    } finally {
      setUploading(false);
    }
  };
  const buildPayload = () => ({
    name: form.name.trim(),
    price: Number(form.price),
    originalPrice: form.originalPrice ? Number(form.originalPrice) : void 0,
    category: form.category,
    subcategory: form.subcategory,
    quantity: Number(form.quantity) || 0,
    inStock: form.inStock,
    sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean),
    images: form.images,
    description: form.description.trim(),
    isNew: form.isNew,
    isTrending: form.isTrending
  });
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (editingId) await api.updateProduct(editingId, buildPayload());
      else await api.createProduct(buildPayload());
      onSaved();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={save} className="max-w-3xl">
    <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-2xl tracking-[0.1em]">{editingId ? "EDIT PRODUCT" : "ADD PRODUCT"}</h2>{editingId && <Button type="button" variant="outline" size="sm" onClick={onCancel}><X className="mr-1 h-4 w-4" /> CANCEL EDIT</Button>}</div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label htmlFor="p-name">Product name *</Label><Input id="p-name" required minLength={2} value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" /></div>
      <div><Label htmlFor="p-price">Price *</Label><Input id="p-price" required type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="mt-1.5" /></div>
      <div><Label htmlFor="p-original">Original price (for sale badge)</Label><Input id="p-original" type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} className="mt-1.5" /></div>
      <div><Label>Category</Label><Select value={form.category} onValueChange={(v) => set("category", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Subcategory</Label><Select value={form.subcategory} onValueChange={(v) => set("subcategory", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{SUBCATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="p-qty">Quantity</Label><Input id="p-qty" type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="mt-1.5" /></div>
      <div className="flex items-end gap-3 pb-1"><Switch id="p-stock" checked={form.inStock} onCheckedChange={(v) => set("inStock", v)} /><Label htmlFor="p-stock">{form.inStock ? "In Stock" : "Out of Stock"}</Label></div>
      <div><Label htmlFor="p-sizes">Sizes (comma-separated) *</Label><Input id="p-sizes" value={form.sizes} onChange={(e) => set("sizes", e.target.value)} className="mt-1.5" /></div>
      <div><Label htmlFor="p-colors">Colors (comma-separated) *</Label><Input id="p-colors" value={form.colors} onChange={(e) => set("colors", e.target.value)} className="mt-1.5" /></div>
      <div className="sm:col-span-2"><Label>Product images ({form.images.length}/8) *</Label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 border border-border px-4 text-sm transition-colors hover:border-foreground">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? "UPLOADING…" : "UPLOAD"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} /></label>
          <Button type="button" variant="outline" onClick={() => { const url = window.prompt("Paste image URL"); if (url && url.trim()) set("images", [...form.images, url.trim()]); }}>ADD URL</Button>
        </div>
        {form.images.length > 0 && <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">{form.images.map((img, i) => <div key={img + i} className="relative aspect-[3/4] overflow-hidden border border-border"><img src={img} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => set("images", form.images.filter((_, idx) => idx !== i))} aria-label="Remove image" className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center bg-background/90 text-foreground hover:bg-destructive hover:text-white"><X className="h-3.5 w-3.5" /></button>{i === 0 && <span className="absolute bottom-1 left-1 bg-background/90 px-1.5 py-0.5 text-[9px] uppercase tracking-widest">Front</span>}</div>)}</div>}
        <p className="mt-2 text-xs text-muted-foreground">First image is the storefront front view. Uploads go to the project server (JPEG, PNG, WebP, AVIF — max 2MB each).</p>
      </div>
      <div className="sm:col-span-2"><Label htmlFor="p-desc">Description / product details *</Label><Textarea id="p-desc" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5" /></div>
      <div className="flex items-center gap-3"><Switch id="p-new" checked={form.isNew} onCheckedChange={(v) => set("isNew", v)} /><Label htmlFor="p-new">New arrival</Label></div>
      <div className="flex items-center gap-3"><Switch id="p-trend" checked={form.isTrending} onCheckedChange={(v) => set("isTrending", v)} /><Label htmlFor="p-trend">Trending</Label></div>
    </div>
    {message && <p className="mt-5 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{message}</p>}
    <div className="mt-6 flex gap-3"><Button type="submit" size="lg" disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 animate-spin" /> SAVING…</> : editingId ? "SAVE CHANGES" : "ADD TO STORE"}</Button>{editingId && <Button type="button" variant="outline" size="lg" onClick={onCancel}>CANCEL</Button>}</div>
  </form>;
}
