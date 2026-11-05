import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Newsletter } from "@/components/Newsletter";
import { LagosMap } from "@/components/LagosMap";

const PRINCIPLES = [
  {
    n: "01",
    title: "SUBSTANCE OVER HYPE",
    body: "We don't chase momentary noise. Every piece is designed to outlast the trend cycle it was born into.",
  },
  {
    n: "02",
    title: "CULTURE FIRST",
    body: "Design starts on the street — in the music, the movement, the rhythm of the city — never in a boardroom.",
  },
  {
    n: "03",
    title: "QUALITY YOU CAN FEEL",
    body: "Heavyweight fabrics, considered construction, precise cuts. If it doesn't feel right, it doesn't ship.",
  },
  {
    n: "04",
    title: "LAGOS TO THE WORLD",
    body: "Rooted in Lagos, worn everywhere. The energy of this city travels — we just put it in a garment.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function Foundation() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <motion.p
            {...fadeUp}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent"
          >
            THE FOUNDATION
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="font-display text-6xl leading-none tracking-wide sm:text-7xl lg:text-8xl"
          >
            SLEEK FOUNDATION
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.16 }}
            className="mx-auto mt-6 max-w-xl text-sm uppercase tracking-[0.25em] text-muted-foreground"
          >
            Less noise. More culture.
          </motion.p>
        </section>

        {/* Manifesto */}
        <section className="border-y border-border bg-card">
          <motion.blockquote
            {...fadeUp}
            className="px-4 py-16 text-center sm:px-6 sm:py-24"
          >
            <p className="font-display text-3xl leading-tight tracking-wide sm:text-5xl">
              "SLEEK IS THE IDEA THAT STYLE DOESN'T SHOUT —
              <span className="text-accent"> IT SPEAKS."</span>
            </p>
            <footer className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              — sleekculture, the foundation
            </footer>
          </motion.blockquote>
        </section>

        {/* Origin */}
        <section className="grid gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-10">
          <motion.div {...fadeUp}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              THE ORIGIN
            </p>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              BORN IN LAGOS
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="space-y-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              sleekculture started the way most real things do — with a
              feeling. The heat, the hustle, the rhythm of Lagos: a city that
              moves fast and dresses faster. We took that energy and built a
              wardrobe around it.
            </p>
            <p>
              Everything we make carries the same idea — clothing that stands
              for something. Not costume, not hype. A sleek, considered
              uniform for people who move with purpose and let the details do
              the talking.
            </p>
            <p>
              The name says it plainly. <span className="text-foreground">Sleek</span> is how
              we carry ourselves. <span className="text-foreground">Culture</span> is where
              it all comes from. Put them together and you get clothing that
              is confident without shouting — streetwear with a foundation.
            </p>
          </motion.div>
        </section>

        {/* Principles */}
        <section className="border-t border-border bg-secondary/50">
          <div className="px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
            <motion.div {...fadeUp} className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                WHAT WE STAND FOR
              </p>
              <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
                THE IDEA BOOK
              </h2>
            </motion.div>
            <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
              {PRINCIPLES.map((p, i) => (
                <motion.div
                  key={p.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.06 * i }}
                  className="group bg-background p-8 transition-colors hover:bg-card sm:p-10"
                >
                  <p className="font-display text-sm tracking-[0.3em] text-accent">
                    {p.n}
                  </p>
                  <h3 className="mt-3 font-display text-2xl tracking-[0.08em]">
                    {p.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Lagos map */}
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
          <motion.div {...fadeUp} className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              HOME BASE
            </p>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              BASED IN LAGOS, NIGERIA
            </h2>
          </motion.div>
          <motion.div {...fadeUp}>
            <LagosMap className="h-[320px] sm:h-[440px]" />
          </motion.div>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Lagos → Worldwide
          </p>
        </section>

        {/* CTA */}
        <section className="border-t border-border">
          <motion.div
            {...fadeUp}
            className="flex flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-10"
          >
            <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
              WEAR THE CULTURE
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/#/shop"
                className="inline-flex h-12 items-center gap-2 bg-foreground px-8 font-display text-sm tracking-[0.2em] text-background transition-colors hover:bg-accent"
              >
                SHOP THE COLLECTION <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/sleekculture"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 border border-border px-8 font-display text-sm tracking-[0.2em] transition-colors hover:border-foreground"
              >
                @SLEEKCULTURE
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      <Newsletter />
      <Footer />
    </div>
  );
}
