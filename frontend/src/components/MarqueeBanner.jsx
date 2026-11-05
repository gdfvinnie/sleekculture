"use strict";
export function MarqueeBanner() {
  const items = [
    "FREE SHIPPING ON ORDERS OVER $150",
    "NEW \u2014 TANK TOPS JUST DROPPED",
    "SLEEKCULTURE WORLDWIDE"
  ];
  const sequence = [...items, ...items, ...items];
  return <div className="overflow-hidden border-y border-border bg-foreground py-3"><div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">{[...sequence, ...sequence].map((text, i) => <span
    key={i}
    className="flex items-center gap-8 font-display text-sm tracking-[0.25em] text-background"
  >{text}<span className="text-white/70">✦</span></span>)}</div></div>;
}
