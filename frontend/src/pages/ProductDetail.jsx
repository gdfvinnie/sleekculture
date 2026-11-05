"use strict";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { useCountry } from "@/context/CountryContext";
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, isLoading } = useProduct(id);
  const { data: products = [] } = useProducts();
  const { addToCart, openCart } = useCart();
  const { formatPrice } = useCountry();
  const [selectedImage, setSelectedImage] = useState(0);
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(null);
  useEffect(() => {
    setSelectedImage(0);
    setSize(null);
    setColor(null);
    setQty(1);
    setError(null);
  }, [id]);
  const related = useMemo(
    () => products.filter((p) => p.id !== id && p.category === product?.category).slice(0, 4),
    [products, id, product?.category]
  );
  if (isLoading) {
    return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex flex-1 items-center justify-center pt-16"><p className="text-sm text-muted-foreground">Loading product…</p></main><Footer /></div>;
  }
  if (!product) {
    return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex flex-1 flex-col items-center justify-center gap-4 pt-16 text-center"><h1 className="font-display text-4xl tracking-widest">
            PRODUCT NOT FOUND
          </h1><p className="text-sm text-muted-foreground">
            This piece may have sold out or been moved.
          </p><Button onClick={() => navigate("/shop")}>BACK TO SHOP</Button></main><Footer /></div>;
  }
  const onSale = product.originalPrice !== void 0 && product.originalPrice > product.price;
  const handleAddToBag = () => {
    if (!product.inStock) return;
    if (!size) {
      setError("Please select a size.");
      return;
    }
    if (!color) {
      setError("Please select a color.");
      return;
    }
    setError(null);
    addToCart({ product, size, color, quantity: qty });
    openCart();
  };
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1 pt-16"><div className="px-4 py-8 sm:px-6 lg:px-10">{
    /* Breadcrumb + back */
  }<nav className="mb-6 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Link to="/" className="transition-colors hover:text-foreground">
              HOME
            </Link><span>/</span><Link to="/shop" className="transition-colors hover:text-foreground">
              SHOP
            </Link><span>/</span><span className="text-foreground">{product.name.toUpperCase()}</span></nav><Link
    to="/shop"
    className="mb-6 inline-block font-display text-sm tracking-[0.25em] underline-offset-4 hover:underline"
  >
            ← BACK TO SHOP
          </Link><div className="grid gap-10 lg:grid-cols-2 lg:gap-16">{
    /* Gallery */
  }<div><div className="relative aspect-[3/4] overflow-hidden bg-secondary"><motion.img
    key={selectedImage}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    src={product.images[selectedImage]}
    alt={product.name}
    className="h-full w-full object-cover"
  /><div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">{!product.inStock && <Badge variant="muted">OUT OF STOCK</Badge>}{product.inStock && product.isNew && <Badge variant="accent">NEW</Badge>}{onSale && <Badge variant="destructive">SALE</Badge>}</div></div><div className="mt-3 grid grid-cols-4 gap-3">{product.images.map((img, i) => <button
    key={img + i}
    onClick={() => setSelectedImage(i)}
    className={cn(
      "aspect-[3/4] overflow-hidden border transition-colors",
      selectedImage === i ? "border-foreground" : "border-transparent hover:border-border"
    )}
  ><img
    src={img}
    alt={`${product.name} view ${i + 1}`}
    loading="lazy"
    className="h-full w-full object-cover"
  /></button>)}</div></div>{
    /* Details */
  }<div><h1 className="font-display text-4xl tracking-wide sm:text-5xl">{product.name.toUpperCase()}</h1>{
    /* Rating */
  }<div className="mt-3 flex items-center gap-2"><div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star
    key={i}
    className={cn(
      "h-4 w-4",
      i < Math.round(product.rating) ? "fill-accent text-accent" : "text-border"
    )}
  />)}</div><span className="text-xs text-muted-foreground">{product.rating.toFixed(1)} · {product.reviews} reviews
                </span></div>{
    /* Price */
  }<div className="mt-4 flex items-baseline gap-3"><span className="text-2xl font-semibold">{formatPrice(product.price)}</span>{onSale && <span className="text-base text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}</div><p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>{
    /* Color pills */
  }<div className="mt-8"><p className="mb-2 font-display text-sm tracking-[0.25em]">
                  COLOR — {color ?? "SELECT"}</p><div className="flex flex-wrap gap-2">{product.colors.map((c) => <button
    key={c}
    onClick={() => {
      setColor(c);
      setError(null);
    }}
    className={cn(
      "border px-4 py-2 text-xs uppercase tracking-widest transition-colors",
      color === c ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
    )}
  >{c}</button>)}</div></div>{
    /* Size grid */
  }<div className="mt-6"><p className="mb-2 font-display text-sm tracking-[0.25em]">
                  SIZE — {size ?? "SELECT"}</p><div className="flex flex-wrap gap-2">{product.sizes.map((s) => <button
    key={s}
    onClick={() => {
      setSize(s);
      setError(null);
    }}
    className={cn(
      "flex h-11 w-11 items-center justify-center border text-xs transition-colors",
      size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
    )}
  >{s}</button>)}</div></div>{
    /* Quantity + add */
  }<div className="mt-8 flex flex-wrap items-center gap-4"><div className="flex items-center border border-border"><button
    onClick={() => setQty((q) => Math.max(1, q - 1))}
    className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-secondary"
    aria-label="Decrease quantity"
  ><Minus className="h-4 w-4" /></button><span className="w-10 text-center text-sm">{qty}</span><button
    onClick={() => setQty((q) => Math.min(10, q + 1))}
    className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-secondary"
    aria-label="Increase quantity"
  ><Plus className="h-4 w-4" /></button></div><Button
    size="lg"
    className="min-w-[200px] flex-1"
    disabled={!product.inStock}
    onClick={handleAddToBag}
  >{product.inStock ? "ADD TO BAG" : "OUT OF STOCK"}</Button></div>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}{
    /* Details accordion */
  }<Accordion type="single" collapsible className="mt-10"><AccordionItem value="materials"><AccordionTrigger>MATERIALS & CARE</AccordionTrigger><AccordionContent>{product.description} Machine wash cold with like colors,
                    hang dry. Do not bleach or tumble dry.
                  </AccordionContent></AccordionItem><AccordionItem value="shipping"><AccordionTrigger>SHIPPING</AccordionTrigger><AccordionContent>
                    Free worldwide shipping on orders over $150. Standard
                    delivery 3–7 business days, express 1–3 days. Ships from
                    regional hubs across 20 countries.
                  </AccordionContent></AccordionItem><AccordionItem value="returns"><AccordionTrigger>RETURNS</AccordionTrigger><AccordionContent>
                    30-day returns on unworn items with tags attached. Refunds
                    are issued to the original payment method within 5 business
                    days of arrival at our warehouse.
                  </AccordionContent></AccordionItem></Accordion></div></div>{
    /* Related */
  }{related.length > 0 && <section className="mt-20"><h2 className="mb-8 font-display text-3xl tracking-wide sm:text-4xl">
                YOU MAY ALSO LIKE
              </h2><div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">{related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div></section>}</div></main><Footer /></div>;
}
