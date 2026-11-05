"use strict";
import { MapPin } from "lucide-react";
const EMBED_URL = "https://www.google.com/maps?q=Lagos%2C+Nigeria&z=11&hl=en&output=embed";
const OPEN_URL = "https://www.google.com/maps/search/?api=1&query=Lagos%2C+Nigeria";
export function LagosMap({ className = "h-[320px] sm:h-[440px]" }) {
  return <div><div className="relative overflow-hidden border border-white/10 bg-[#0e0e11] shadow-lg">{
    /* On-brand loading state while tiles stream in */
  }<div
    aria-hidden
    className="absolute inset-0 flex items-center justify-center bg-[#0e0e11]"
  ><span className="inline-flex items-center gap-2 font-display text-sm tracking-[0.3em] text-white/60"><MapPin className="h-4 w-4 animate-pulse text-white/80" />
            LOADING LAGOS…
          </span></div>{
    /*
      Dark-mode map: Google's keyless embed has no native dark theme, so we
      invert + hue-rotate the tiles — light map becomes a dark one with
      correct-looking colors. Slight desaturation keeps it moody; hovering
      blooms a touch of color and brightness back in.
    */
  }<iframe
    title="Map of Lagos, Nigeria — dark mode"
    src={EMBED_URL}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    className={`relative w-full transition-all duration-500 invert-[0.92] hue-rotate-180 grayscale-[0.85] contrast-90 brightness-95 hover:grayscale-[0.2] hover:brightness-105 ${className}`}
    style={{ border: 0 }}
    allowFullScreen
  />{
    /* Location chip */
  }<span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-2 border border-white/15 bg-black/70 px-3 py-1.5 font-display text-xs tracking-[0.25em] text-white backdrop-blur-sm"><MapPin className="h-3.5 w-3.5 text-blue-300" />
          LAGOS, NIGERIA
        </span></div><div className="mt-3 text-center"><a
    href={OPEN_URL}
    target="_blank"
    rel="noreferrer"
    className="text-xs uppercase tracking-[0.25em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
  >
          Open in Google Maps ↗
        </a></div></div>;
}
