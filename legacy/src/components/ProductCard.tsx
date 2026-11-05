import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCountry } from "@/context/CountryContext";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  index?: number;
}

/** Neutral swatch tones matching the collection colorways. */
const COLOR_HEX: Record<string, string> = {
  "Washed Black": "#3a3a38",
  "Stone Grey": "#a9a49c",
  Bone: "#ece5d8",
  "Optic White": "#ffffff",
  "Jet Black": "#1c1c1c",
  Sand: "#d3c3a3",
  Black: "#1c1c1c",
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { formatPrice } = useCountry();
  const [hovered, setHovered] = useState(false);

  const onSale =
    product.originalPrice !== undefined && product.originalPrice > product.price;
  const hoverImage = product.images.length > 1 ? product.images[1] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative"
    >
      <Link to={`/product/${product.id}`} className="block">
        {/* 3:4 image with editorial hover swap */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-opacity duration-500",
              hoverImage && hovered ? "opacity-0" : "opacity-100",
            )}
          />
          {hoverImage && (
            <img
              src={hoverImage}
              alt=""
              aria-hidden
              loading="lazy"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-all duration-700",
                hovered ? "scale-105 opacity-100" : "scale-100 opacity-0",
              )}
            />
          )}

          {/* Badges — kept quiet */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {!product.inStock && (
              <span className="bg-background/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Out of stock
              </span>
            )}
            {product.inStock && product.isNew && (
              <span className="bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                New
              </span>
            )}
            {onSale && (
              <span className="bg-destructive px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                Sale
              </span>
            )}
          </div>
        </div>

        {/* Meta — quiet editorial row */}
        <div className="pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[13px] font-medium tracking-wide">
              {product.name}
            </h3>
            <span className="shrink-0 text-[13px] font-medium">
              {formatPrice(product.price)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            {/* Color swatches */}
            <div className="flex items-center gap-1.5">
              {product.colors.map((c) => (
                <span
                  key={c}
                  title={c}
                  className="h-2.5 w-2.5 rounded-full border border-border"
                  style={{ backgroundColor: COLOR_HEX[c] ?? "#d4d4d4" }}
                />
              ))}
            </div>
            {onSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
