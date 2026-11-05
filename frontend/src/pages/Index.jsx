"use strict";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSlider } from "@/components/HeroSlider";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { ProductCard } from "@/components/ProductCard";
import { Newsletter } from "@/components/Newsletter";
import { LagosMap } from "@/components/LagosMap";
import { useProducts } from "@/hooks/useProducts";
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" }
};
const CATEGORIES = [
  {
    title: "SLEEK HOODIES",
    cat: "Hoodies",
    to: "/shop?subcategory=Hoodies"
  },
  {
    title: "SLEEK TEE",
    cat: "T-Shirts",
    to: "/shop?subcategory=T-Shirts"
  },
  {
    title: "SLEEK TANK TEE",
    cat: "Tank Tops",
    to: "/shop?subcategory=Tank Tops"
  },
  {
    title: "ACCESSORIES",
    cat: "Accessories",
    to: "/accessories"
  }
];
export default function Index() {
  const { data: products = [], isLoading } = useProducts();
  const featured = products.slice(0, 4);
  return <div className="min-h-screen"><Navbar /><HeroSlider /><MarqueeBanner />{
    /* Featured collection */
  }<section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10"><motion.div {...fadeUp} className="mb-10 flex items-end justify-between gap-6"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              SLEEKCULTURE
            </p><h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              THE FEATURED COLLECTION
            </h2></div><Link
    to="/shop"
    className="hidden shrink-0 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline sm:block"
  >
            VIEW ALL
          </Link></motion.div>{isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">
            Loading the collection…
          </p> : <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">{featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}<Link
    to="/shop"
    className="group relative flex aspect-[3/4] items-center justify-center bg-secondary transition-colors hover:bg-card"
  ><span className="inline-flex items-center gap-2 font-display text-sm tracking-[0.25em]">
                SHOP ALL{" "}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span></Link><Link
    to="/foundation"
    className="group relative hidden aspect-[3/4] items-center justify-center border border-border bg-background transition-colors hover:bg-card md:flex"
  ><span className="inline-flex items-center gap-2 font-display text-sm tracking-[0.25em]">
                THE COLLECTION <ArrowUpRight className="h-4 w-4" /></span></Link></div>}</section>{
    /* Category showcases — exactly 4 cards each */
  }{CATEGORIES.map(({ title, cat, to }, sectionIdx) => {
    const items = products.filter((p) => p.category === cat).slice(0, 4);
    if (items.length === 0) return null;
    return <section key={cat} className={sectionIdx % 2 === 1 ? "bg-secondary/50" : ""}><div className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10"><motion.div
      {...fadeUp}
      className="mb-10 flex items-end justify-between gap-6"
    ><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                    SLEEKCULTURE
                  </p><h2 className="font-display text-4xl tracking-wide sm:text-5xl">{title}</h2></div><Link
      to={to}
      className="hidden shrink-0 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline sm:block"
    >
                  SHOP {title}</Link></motion.div><div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">{items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div></div></section>;
  })}{
    /* About the collection */
  }<section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10"><motion.div {...fadeUp}><p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] p-0 text-accent">
              ABOUT THE COLLECTION
            </p><h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              PLAIN, BUT NEVER BASIC
            </h2><p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base sm:text-foreground">
            The sleekculture line is a collection of plain,
            premium building blocks — hoodies, tees, tanks, and caps
            in washed black, stone grey, bone, sand, and optic white. No
            graphics, no shouting.
              Heavyweight fabrics, considered silhouettes, and one consistent
              visual system across every photograph.
            </p><Link
    to="/foundation"
    className="mt-6 inline-flex items-center gap-2 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline"
  >
              READ THE FOUNDATION <ArrowUpRight className="h-4 w-4" /></Link></motion.div></section>{
    /* Lagos home base map */
  }<section className="border-t border-border"><div className="px-4 pt-14 sm:px-6 sm:pt-20 lg:px-10"><div className="mb-8 flex items-end justify-between gap-6"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                HOME BASE
              </p><h2 className="font-display text-4xl tracking-wide sm:text-5xl">
                BASED IN LAGOS, NIGERIA
              </h2></div><Link
    to="/foundation"
    className="hidden shrink-0 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline sm:block"
  >
              OUR STORY
            </Link></div></div>{
    /* Full-bleed map — edge to edge like the hero, no side gutters */
  }<LagosMap className="h-[320px] w-full sm:h-[460px] lg:h-[600px]" /></section><Newsletter /><Footer /></div>;
}
