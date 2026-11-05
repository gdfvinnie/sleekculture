"use strict";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CalendarDays, LogOut, ShoppingBag, UserRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
export default function Account() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);
  if (loading || !user) {
    return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex flex-1 items-center justify-center pt-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" /></main><Footer /></div>;
  }
  const displayName = user.name ?? user.email.split("@")[0];
  const memberSince = user.memberSince ? (/* @__PURE__ */ new Date(user.memberSince + "Z")).toLocaleDateString(void 0, {
    year: "numeric",
    month: "long"
  }) : null;
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1 pt-16"><div className="px-4 py-12 sm:px-6 sm:py-16"><header className="mb-10 text-center"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              MY ACCOUNT
            </p><h1 className="font-display text-5xl tracking-wide sm:text-6xl">{displayName.toUpperCase()}</h1></header>{
    /* Profile card */
  }<div className="border border-border bg-card"><div className="flex items-center gap-4 border-b border-border p-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary"><UserRound className="h-5 w-5 text-muted-foreground" /></span><div className="min-w-0"><p className="truncate font-medium">{user.name ?? "sleekculture member"}</p><p className="text-sm text-muted-foreground">Customer account</p></div></div><dl className="divide-y divide-border text-sm"><div className="flex items-center gap-3 px-6 py-4"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" /><dt className="w-24 shrink-0 text-muted-foreground">Email</dt><dd className="truncate">{user.email}</dd></div>{memberSince && <div className="flex items-center gap-3 px-6 py-4"><CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" /><dt className="w-24 shrink-0 text-muted-foreground">Member since</dt><dd>{memberSince}</dd></div>}</dl></div>{
    /* Orders placeholder */
  }<div className="mt-6 border border-border bg-card p-8 text-center"><ShoppingBag className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 font-display text-lg tracking-[0.1em]">NO ORDERS YET</p><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Your order history will appear here once you complete a purchase.
            </p><Button className="mt-5" onClick={() => navigate("/shop")}>
              SHOP THE COLLECTION
            </Button></div><div className="mt-8 flex justify-center"><Button variant="outline" size="lg" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> SIGN OUT
            </Button></div></div></main><Footer /></div>;
}
