"use strict";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCountry } from "@/context/CountryContext";
export function ProductCard({ product, index = 0 }) {
  const { formatPrice } = useCountry();
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const onSale = product.originalPrice !== void 0 && product.originalPrice > product.price;
  const hoverImage = product.images.length > 1 ? product.images[1] : null;
  const primary = imageError ? null : product.images[0];
  return <motion.article
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    className="group relative"  ><Link to={`/product/${product.id}`} className="block">{
  /* 3:4 image with editorial hover swap */
  }<div className="relative aspect-[3/4] overflow-hidden bg-secondary">{primary ? <img
    src={primary}
    alt={product.name}
    loading="lazy"
    onError={() => setImageError(true)}
    className={cn(
      "h-full w-full object-cover transition-opacity duration-500",
      hoverImage && hovered ? "opacity-0" : "opacity-100"
    )}
  /> : <div className="flex h-full w-full items-center justify-center bg-secondary"><span className="font-display text-3xl tracking-[0.25em] text-muted-foreground">SLEEK</span></div>}{hoverImage && <img
    src={hoverImage}
    alt=""
    aria-hidden
    loading="lazy"
    onError={(e) => { e.currentTarget.style.display = "none"; }}
    className={cn(
      "absolute inset-0 h-full w-full object-cover transition-all duration-700",
      hovered ? "scale-105 opacity-100" : "scale-100 opacity-0"
    )}
  />}{
    /* Badges — kept quiet */
  }<div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">{!product.inStock && <span className="bg-background/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Out of stock
              </span>}{product.inStock && product.isNew && <span className="bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                New
              </span>}{onSale && <span className="bg-destructive px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                Sale
              </span>}</div></div>{
    /* Meta — quiet editorial row */
  }<div className="pt-3"><div className="flex items-baseline justify-between gap-3"><h3 className="truncate text-[13px] font-medium tracking-wide">{product.name}</h3><span className="shrink-0 text-[13px] font-medium">{formatPrice(product.price)}</span></div><div className="mt-1.5 flex items-center justify-end gap-3">{onSale && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}</div></div></Link></motion.article>;
}
