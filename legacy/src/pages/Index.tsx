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
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/context/CountryContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/types/product";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const CATEGORIES = [
  {
    title: "HOODIES",
    cat: "Hoodies",
    desc: "Heavyweight loopback fleece. No draws, no prints — just weight and drape.",
    to: "/shop?subcategory=Hoodies",
  },
  {
    title: "T-SHIRTS",
    cat: "T-Shirts",
    desc: "Compact 240gsm jersey with structured collars that keep their line.",
    to: "/shop?subcategory=T-Shirts",
  },
  {
    title: "TANK TOPS",
    cat: "Tank Tops",
    desc: "Clean-bound armholes in compact jersey — the summer layer.",
    to: "/shop?subcategory=Tank Tops",
  },
  {
    title: "SHORTS",
    cat: "Shorts",
    desc: "Clean-faced twill, 7-inch inseam, nothing else.",
    to: "/shop?subcategory=Shorts",
  },
  {
    title: "ACCESSORIES",
    cat: "Accessories",
    desc: "Unstructured six-panel caps. The quiet finish to any look.",
    to: "/accessories",
  },
];

/** Outfits built entirely from sleekculture pieces, shoppable in one tap. */
const LOOKS: { name: string; pieces: { id: string; size: string; color: string }[] }[] = [
  {
    name: "LOOK 01 — QUIET LAYERS",
    pieces: [
      { id: "e1", size: "M", color: "Washed Black" },
      { id: "e4", size: "M", color: "Optic White" },
      { id: "e7", size: "32", color: "Washed Black" },
    ],
  },
  {
    name: "LOOK 02 — WARM NEUTRALS",
    pieces: [
      { id: "e3", size: "M", color: "Bone" },
      { id: "e6", size: "M", color: "Sand" },
      { id: "e8", size: "32", color: "Sand" },
    ],
  },
  {
    name: "LOOK 03 — FULL PLAIN",
    pieces: [
      { id: "e2", size: "M", color: "Stone Grey" },
      { id: "e5", size: "M", color: "Jet Black" },
      { id: "e10", size: "ONE SIZE", color: "Black" },
    ],
  },
];

export default function Index() {
  const { data: products = [], isLoading } = useProducts();
  const { formatPrice } = useCountry();
  const { addToCart, openCart } = useCart();
  const { toast } = useToast();

  const byId = (id: string): Product | undefined =>
    products.find((p) => p.id === id);

  const featured = products.slice(0, 4);

  const addLook = (look: (typeof LOOKS)[number]) => {
    const valid = look.pieces
      .map(({ id, size, color }) => ({ product: byId(id), size, color }))
      .filter((x): x is { product: Product; size: string; color: string } =>
        Boolean(x.product),
      );
    valid.forEach(({ product, size, color }) =>
      addToCart({ product, size, color, quantity: 1 }),
    );
    if (valid.length > 0) {
      openCart();
      toast({
        title: "LOOK ADDED TO BAG",
        description: `${look.name} — ${valid.length} pieces added.`,
      });
    }
  };

  const lookTotal = (look: (typeof LOOKS)[number]) =>
    look.pieces.reduce((sum, pc) => sum + (byId(pc.id)?.price ?? 0), 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSlider />
      <MarqueeBanner />

      {/* Featured collection */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <motion.div {...fadeUp} className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              SLEEKCULTURE
            </p>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              THE FEATURED COLLECTION
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden shrink-0 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline sm:block"
          >
            VIEW ALL
          </Link>
        </motion.div>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading the collection…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
            <Link
              to="/shop"
              className="group relative flex aspect-[3/4] items-center justify-center bg-secondary transition-colors hover:bg-card"
            >
              <span className="inline-flex items-center gap-2 font-display text-sm tracking-[0.25em]">
                SHOP ALL{" "}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              to="/foundation"
              className="group relative hidden aspect-[3/4] items-center justify-center border border-border bg-background transition-colors hover:bg-card md:flex"
            >
              <span className="inline-flex items-center gap-2 font-display text-sm tracking-[0.25em]">
                THE COLLECTION <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        )}
      </section>

      {/* Category showcases */}
      {CATEGORIES.map(({ title, cat, desc, to }, sectionIdx) => {
        const items = products.filter((p) => p.category === cat).slice(0, 3);
        if (items.length === 0) return null;
        return (
          <section key={cat} className={sectionIdx % 2 === 1 ? "bg-secondary/50" : ""}>
            <div className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
              <motion.div
                {...fadeUp}
                className="mb-10 flex items-end justify-between gap-6"
              >
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                    SLEEKCULTURE
                  </p>
                  <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
                    {title}
                  </h2>
                  <p className="mt-3 max-w-md text-sm text-muted-foreground">{desc}</p>
                </div>
                <Link
                  to={to}
                  className="hidden shrink-0 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline sm:block"
                >
                  SHOP {title}
                </Link>
              </motion.div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
                {items.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Complete the look */}
      <section className="border-y border-border bg-secondary/50">
        <div className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <motion.div {...fadeUp} className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              COMPLETE THE LOOK
            </p>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              THREE LOOKS, ZERO LOGOS
            </h2>
          </motion.div>
          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
            {LOOKS.map((look) => (
              <motion.div
                key={look.name}
                {...fadeUp}
                className="flex flex-col bg-background p-6 sm:p-8"
              >
                <p className="mb-4 font-display text-lg tracking-[0.15em]">
                  {look.name}
                </p>
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {look.pieces.map((pc) => {
                    const product = byId(pc.id);
                    return (
                      <div key={pc.id} className="aspect-[3/4] overflow-hidden bg-secondary">
                        {product && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {look.pieces.length} pieces · {formatPrice(lookTotal(look))}
                  </span>
                  <Button size="sm" onClick={() => addLook(look)}>
                    ADD LOOK
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
            One tap adds every piece — sizes default to M / 32 / One Size, adjust in the bag.
          </p>
        </div>
      </section>

      {/* About the collection */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              ABOUT THE COLLECTION
            </p>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              PLAIN, BUT NEVER BASIC
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base sm:text-foreground">
            The sleekculture line is a twelve-piece collection of plain,
            premium building blocks — hoodies, tees, tanks, shorts, and caps
            in washed black, stone grey, bone, sand, and optic white. No
            graphics, no shouting.
              Heavyweight fabrics, considered silhouettes, and one consistent
              visual system across every photograph.
            </p>
            <Link
              to="/foundation"
              className="mt-6 inline-flex items-center gap-2 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline"
            >
              READ THE FOUNDATION <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div {...fadeUp} className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] overflow-hidden bg-secondary">
              <img
                src="https://images.pexels.com/photos/19461550/pexels-photo-19461550.jpeg?auto=compress&cs=tinysrgb&w=700"
                alt="sleekculture hoodie, back view"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="mt-8 aspect-[3/4] overflow-hidden bg-secondary">
              <img
                src="https://images.pexels.com/photos/8217536/pexels-photo-8217536.jpeg?auto=compress&cs=tinysrgb&w=700"
                alt="sleekculture tee, folded flat"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lagos home base map */}
      <section className="border-t border-border">
        <div className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                HOME BASE
              </p>
              <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
                BASED IN LAGOS, NIGERIA
              </h2>
            </div>
            <Link
              to="/foundation"
              className="hidden shrink-0 font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline sm:block"
            >
              OUR STORY
            </Link>
          </div>
          <LagosMap className="h-[300px] sm:h-[420px]" />
        </div>
      </section>

      <Newsletter />
      <Footer />
    </div>
  );
}
