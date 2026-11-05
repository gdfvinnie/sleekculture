import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CountrySelector } from "@/components/CountrySelector";
import { Sidebar } from "@/components/Sidebar";
import { SearchDialog } from "@/components/SearchDialog";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // White icons/text while floating over the dark hero (home, top of page)
  const overHero = location.pathname === "/" && !scrolled;
  const iconClass = overHero
    ? "text-white hover:text-white/70"
    : "text-foreground hover:text-accent";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled
            ? "border-b border-border bg-white/95 backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
          {/* Left: menu trigger (sidebar is the primary navigation) */}
          <div className="flex flex-1 items-center">
            <button
              onClick={() => setMenuOpen(true)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center transition-colors",
                iconClass,
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Center: brand */}
          <Link
            to="/"
            aria-label="sleekculture — home"
            className="transition-opacity hover:opacity-70"
          >
            <img
              src="/sleekculture-logo.png"
              alt="sleekculture"
              className={cn(
                "h-9 w-32 object-cover object-center transition-all sm:h-10 sm:w-40",
                // Dark hero → render the graffiti white; white navbar → keep it black
                overHero ? "invert mix-blend-screen" : "mix-blend-multiply",
              )}
            />
          </Link>

          {/* Right: utilities */}
          <div className="flex flex-1 items-center justify-end gap-0.5">
            <div className="hidden sm:block">
              <CountrySelector />
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center transition-colors",
                iconClass,
              )}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                navigate(user ? (isAdmin ? "/admin" : "/account") : "/auth")
              }
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center transition-colors",
                iconClass,
              )}
              aria-label="Account"
            >
              <User className="h-5 w-5" />
              {user && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent"
                />
              )}
            </button>
            <button
              onClick={openCart}
              className={cn(
                "relative inline-flex h-10 w-10 items-center justify-center transition-colors",
                iconClass,
              )}
              aria-label="Open bag"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <Sidebar open={menuOpen} onOpenChange={setMenuOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
