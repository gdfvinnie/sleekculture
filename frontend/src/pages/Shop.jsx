"use strict";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
const CATEGORIES = ["All", "New Arrivals", "Hoodies", "T-Shirts", "Tank Tops", "Accessories"];
const PRICE_FILTERS = [
  { label: "All", min: 0, max: Infinity },
  { label: "Under $100", min: 0, max: 100 },
  { label: "$100 \u2013 $200", min: 100, max: 200 },
  { label: "Over $200", min: 200, max: Infinity }
];
const SUBCATEGORY_ALIASES = {
  "Sleek Tee": "T-Shirts",
  "Sleek Tank Tee": "Tank Tops",
  "Sleek Hoodies": "Hoodies",
  "T-shirts": "T-Shirts",
  "t-shirts": "T-Shirts",
  Shirts: "Shirts",
  Caps: "Caps"
};
export default function Shop({ fixedCategory, fixedLabel }) {
  const { data: products = [], isLoading } = useProducts();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(fixedCategory ?? "All");
  const [subcategory, setSubcategory] = useState(null);
  const [priceIdx, setPriceIdx] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => {
    if (fixedCategory) return;
    const q = searchParams.get("category");
    if (q && CATEGORIES.includes(q)) {
      setCategory(q);
    }
    const sub = searchParams.get("subcategory");
    if (sub) {
      const normalized = SUBCATEGORY_ALIASES[sub] ?? sub;
      setSubcategory(normalized);
      setCategory("All");
    } else {
      setSubcategory(null);
    }
  }, [searchParams, fixedCategory]);
  const filtered = useMemo(() => {
    const { min, max } = PRICE_FILTERS[priceIdx];
    return products.filter((p) => {
      const matchesCategory = category === "All" || (category === "New Arrivals" ? p.isNew : p.category.toLowerCase() === category.toLowerCase());
      const matchesSubcategory = !subcategory || p.subcategory.toLowerCase() === subcategory.toLowerCase() || p.category.toLowerCase() === subcategory.toLowerCase();
      const matchesPrice = p.price >= min && p.price < max;
      return matchesCategory && matchesSubcategory && matchesPrice;
    });
  }, [products, category, subcategory, priceIdx]);
  const title = subcategory ?? fixedLabel ?? fixedCategory ?? "SHOP ALL";
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1 pt-16"><div className="px-4 py-10 sm:px-6 lg:px-10">{
    /* Header */
  }<header className="mb-8 text-center"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              SLEEKCULTURE
            </p><h1 className="font-display text-5xl tracking-wide sm:text-6xl">{title.toUpperCase()}</h1></header>{
    /* Controls */
  }<div className="mb-8 flex flex-col items-center gap-4 border-y border-border py-4 md:flex-row md:justify-between">{!fixedCategory && <div className="flex flex-wrap justify-center gap-1 md:justify-start">{CATEGORIES.map((c) => <button
    key={c}
    onClick={() => setCategory(c)}
    className={cn(
      "px-4 py-2 font-display text-sm tracking-[0.2em] transition-colors",
      category === c ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
    )}
  >{c.toUpperCase()}</button>)}</div>}<div className="relative flex items-center gap-4"><span className="text-xs uppercase tracking-widest text-muted-foreground">{filtered.length} product{filtered.length === 1 ? "" : "s"}</span><Button
    variant="outline"
    size="sm"
    onClick={() => setFilterOpen((o) => !o)}
  >
                FILTER
              </Button><AnimatePresence>{filterOpen && <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="absolute right-0 top-12 z-20 w-52 border border-border bg-background p-2 shadow-lg"
  >{PRICE_FILTERS.map((f, i) => <button
    key={f.label}
    onClick={() => {
      setPriceIdx(i);
      setFilterOpen(false);
    }}
    className={cn(
      "block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
      priceIdx === i && "font-semibold"
    )}
  >{f.label}</button>)}</motion.div>}</AnimatePresence></div></div>{
    /* Grid */
  }{isLoading ? <p className="py-20 text-center text-sm text-muted-foreground">
              Loading products…
            </p> : filtered.length === 0 ? <div className="py-24 text-center"><p className="font-display text-2xl tracking-widest">
                NOTHING FOUND
              </p><p className="mt-2 text-sm text-muted-foreground">
                Try a different category or price range.
              </p></div> : <motion.div layout className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</motion.div>}</div></main><Footer /></div>;
}
