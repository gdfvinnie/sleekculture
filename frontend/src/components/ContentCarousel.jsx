"use strict";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
export function ContentCarousel({
  title,
  viewAllLink,
  children,
  isEmpty = false,
  emptyLabel = "CONTENT COMING SOON"
}) {
  const trackRef = useRef(null);
  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };
  return <section className="py-14 sm:py-20"><div className="px-4 sm:px-6 lg:px-10"><div className="mb-8 flex items-end justify-between"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              SLEEKCULTURE
            </p><h2 className="font-display text-4xl tracking-wide sm:text-5xl">{title}</h2></div><div className="flex items-center gap-4">{viewAllLink && <a
    href={viewAllLink}
    className="hidden font-display text-sm tracking-[0.25em] text-foreground underline-offset-4 hover:underline sm:block"
  >
                VIEW ALL
              </a>}<div className="flex gap-1"><button
    onClick={() => scrollBy(-1)}
    aria-label="Scroll left"
    className="flex h-10 w-10 items-center justify-center border border-border transition-colors hover:border-foreground"
  ><ArrowLeft className="h-4 w-4" /></button><button
    onClick={() => scrollBy(1)}
    aria-label="Scroll right"
    className="flex h-10 w-10 items-center justify-center border border-border transition-colors hover:border-foreground"
  ><ArrowRight className="h-4 w-4" /></button></div></div></div>{isEmpty ? <div className="flex h-64 items-center justify-center border border-dashed border-border bg-card"><p className="font-display text-xl tracking-[0.3em] text-muted-foreground">{emptyLabel}</p></div> : <div
    ref={trackRef}
    className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
  >{children}</div>}</div></section>;
}
