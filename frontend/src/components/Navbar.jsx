"use strict";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { CountrySelector } from "@/components/CountrySelector";
import { Sidebar } from "@/components/Sidebar";
import { SearchDialog } from "@/components/SearchDialog";

/* A slim, modern sweat-droplet mark drawn from two arcs and a tip —
   used as the site's menu trigger. Inherits currentColor, matching the
   navbar's icon styling exactly like the other utility icons. */
export function DropletIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.8c4.2 6 6.2 9.4 6.2 11.5a6.2 6.2 0 1 1-12.4 0c0-2.1 2-5.5 6.2-11.5Z" />
      <path d="M9.6 13.6a2.9 2.9 0 0 0 2.4 3.4" />
    </svg>
  );
}
/* Base-aware asset URL — works on any host (root or GitHub Pages sub-path). */
const LOGO_SRC = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/sleekculture-logo.png`;
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  /* The hero banner is a light image, so icons and the logo stay dark in
     both states — no special over-hero treatment is needed anymore. */
  const iconClass = "text-foreground hover:text-accent";
  return <><header
    className={cn(
      "fixed inset-x-0 top-0 z-40 transition-all duration-300",
      scrolled ? "border-b border-border bg-white/95 backdrop-blur-md" : "bg-transparent"
    )}
  ><div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">{
    /* Left: menu trigger (sidebar is the primary navigation) */
  }<div className="flex flex-1 items-center"><button
    onClick={() => setMenuOpen(true)}
    className={cn(
      "inline-flex h-10 w-10 items-center justify-center transition-colors group",
      iconClass
    )}
    aria-label="Open menu"
  ><DropletIcon className="h-[21px] w-[21px] transition-transform duration-300 ease-out group-hover:scale-110" /></button></div>{
    /* Center: brand */
  }<Link
    to="/"
    aria-label="sleekculture — home"
    className="transition-opacity hover:opacity-70"
  ><img
    src={LOGO_SRC}
    alt="sleekculture"
    className="h-9 w-32 object-cover object-center transition-all mix-blend-multiply sm:h-10 sm:w-40"
  /></Link>{
    /* Right: utilities */
  }<div className="flex flex-1 items-center justify-end gap-0.5"><div className="hidden sm:block"><CountrySelector /></div><button
    onClick={() => setSearchOpen(true)}
    className={cn(
      "inline-flex h-10 w-10 items-center justify-center transition-colors",
      iconClass
    )}
    aria-label="Search"
  ><Search className="h-5 w-5" /></button><button
    onClick={openCart}
    className={cn(
      "relative inline-flex h-10 w-10 items-center justify-center transition-colors",
      iconClass
    )}
    aria-label="Open bag"
  ><ShoppingBag className="h-5 w-5" />{cartCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</span>}</button></div></div></header><Sidebar open={menuOpen} onOpenChange={setMenuOpen} /><SearchDialog open={searchOpen} onOpenChange={setSearchOpen} /></>;
}
