"use strict";
import { Link } from "react-router-dom";

/* Static hero banner — single attached brand image, no slider/carousel.
   The EXPLORE call-to-action sits centered directly below the banner. */
export function HeroSlider() {
  return (
    <section className="w-full bg-background">
      {/* Banner — light graffiti-on-brick photo. On small screens it keeps a
          comfortable banner ratio instead of forcing a full viewport. */}
      <div className="relative h-[52vh] min-h-[320px] w-full overflow-hidden bg-white sm:h-[60vh] lg:h-[68vh]">
        <img
          src={`${import.meta.env.BASE_URL}hero-banner.jpeg`}
          alt="sleekculture — graffiti logo on white brick"
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
      </div>
      {/* CTA — centered directly below the banner */}
      <div className="flex justify-center bg-background py-8 sm:py-10">
        <Link
          to="/shop"
          className="inline-flex h-12 items-center justify-center border border-foreground bg-foreground px-12 font-display text-base tracking-[0.2em] text-background transition-colors hover:bg-transparent hover:text-foreground"
        >
          EXPLORE
        </Link>
      </div>
    </section>
  );
}
