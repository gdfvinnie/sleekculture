import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, ChevronDown, Instagram } from "lucide-react";
import { CountrySelector } from "@/components/CountrySelector";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Clothing categories listed under Collections, in order. */
const COLLECTION_ITEMS = ["T-Shirts", "Tank Tops", "Hoodies", "Shorts"];

/** Sub-items listed under Accessories. */
const ACCESSORY_ITEMS = [{ to: "/accessories", label: "Caps" }];

const MAIN_LINKS = [
  { to: "/foundation", label: "SLEEK FOUNDATION" },
  { to: "/contact", label: "CONTACT" },
];

const panelMotion = {
  initial: { x: "-100%" },
  animate: { x: 0 },
  exit: { x: "-100%" },
  transition: { type: "spring" as const, stiffness: 320, damping: 34 },
};

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [accessoriesOpen, setAccessoriesOpen] = useState(true);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            aria-hidden
          />

          {/* Panel */}
          <motion.aside
            {...panelMotion}
            transition={{ ...panelMotion.transition }}
            className="fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-md flex-col border-r border-border bg-background shadow-2xl"
            role="dialog"
            aria-label="Site navigation"
          >
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5 sm:px-7">
              <img
                src="/sleekculture-logo.png"
                alt="sleekculture"
                className="h-8 w-28 object-cover object-center mix-blend-multiply"
              />
              <button
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 w-10 items-center justify-center transition-colors hover:text-accent"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <motion.div
                initial="closed"
                animate="open"
                variants={{
                  open: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
                }}
                className="flex flex-col"
              >
                {/* 01 — Collections (expandable) */}
                <motion.div
                  variants={{
                    closed: { opacity: 0, x: -24 },
                    open: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="border-b border-border"
                >
                  <button
                    onClick={() => setCollectionsOpen((o) => !o)}
                    aria-expanded={collectionsOpen}
                    className="group flex w-full items-center justify-between py-5 text-left"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-body text-[10px] font-medium tracking-widest text-muted-foreground">
                        01
                      </span>
                      <span className="font-display text-2xl font-bold tracking-[0.12em] transition-colors group-hover:text-accent">
                        COLLECTIONS
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                        collectionsOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {collectionsOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {COLLECTION_ITEMS.map((item) => (
                          <li key={item}>
                            <Link
                              to={`/shop?subcategory=${encodeURIComponent(item)}`}
                              onClick={() => onOpenChange(false)}
                              className="group flex items-center gap-3 py-2.5 pl-9 text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <span className="h-px w-3 bg-border transition-all duration-300 group-hover:w-6 group-hover:bg-accent" />
                              <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                                {item}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* 02 — Accessories (expandable, caps live here) */}
                <motion.div
                  variants={{
                    closed: { opacity: 0, x: -24 },
                    open: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="border-b border-border"
                >
                  <button
                    onClick={() => setAccessoriesOpen((o) => !o)}
                    aria-expanded={accessoriesOpen}
                    className="group flex w-full items-center justify-between py-5 text-left"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-body text-[10px] font-medium tracking-widest text-muted-foreground">
                        02
                      </span>
                      <span className="font-display text-2xl font-bold tracking-[0.12em] transition-colors group-hover:text-accent">
                        ACCESSORIES
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                        accessoriesOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {accessoriesOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {ACCESSORY_ITEMS.map((item) => (
                          <li key={item.label}>
                            <Link
                              to={item.to}
                              onClick={() => onOpenChange(false)}
                              className="group flex items-center gap-3 py-2.5 pl-9 text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <span className="h-px w-3 bg-border transition-all duration-300 group-hover:w-6 group-hover:bg-accent" />
                              <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                                {item.label}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* 03–04 — direct links */}
                {MAIN_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    variants={{
                      closed: { opacity: 0, x: -24 },
                      open: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      to={link.to}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-baseline gap-4 py-5"
                    >
                      <span className="font-body text-[10px] font-medium tracking-widest text-muted-foreground">
                        {String(i + 3).padStart(2, "0")}
                      </span>
                      <span className="font-display text-2xl font-bold tracking-[0.12em] transition-colors group-hover:text-accent">
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </nav>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="shrink-0 border-t border-border px-5 py-6 sm:px-7"
            >
              <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                Ship to
              </p>
              <CountrySelector />
              <div className="mt-5 flex items-center justify-between">
                <p className="font-body text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  Lagos → Worldwide
                </p>
                <a
                  href="https://www.instagram.com/sleekculture"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="sleekculture on Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center border border-border transition-colors hover:border-foreground"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
