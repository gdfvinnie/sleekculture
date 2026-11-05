import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const hero = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const SLIDES = [
  {
    id: "sleek-culture",
    // Confident, composed studio portrait — the brand's anchor image
    image: hero(34509255),
    title: "SLEEK CULTURE",
    subtitle: "WHERE FASHION MEETS CONFIDENCE",
    cta: "EXPLORE",
    to: "/shop",
  },
  {
    id: "the-collection",
    image: hero(30723828),
    title: "THE COLLECTION",
    subtitle: "PLAIN BY DESIGN — BUILT TO LAST",
    cta: "DISCOVER",
    to: "/shop",
  },
];

const AUTOPLAY_MS = 5000;

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const goTo = useCallback((i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
    startRef.current = performance.now();
    setProgress(0);
  }, []);

  useEffect(() => {
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / AUTOPLAY_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        startRef.current = now;
        setIndex((i) => (i + 1) % SLIDES.length);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Slides */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Ken Burns zoom */}
          <motion.img
            src={SLIDES[index].image}
            alt={SLIDES[index].title}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: "easeOut" }}
            className="h-full w-full object-cover object-[50%_35%]"
          />
          {/* Dark gradient overlay — fixed regardless of light theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Fixed white copy — readable on any photography */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="max-w-3xl text-white"
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                SLEEKCULTURE — SC26
              </p>
              <h1 className="font-display text-7xl leading-none tracking-wide sm:text-8xl lg:text-9xl">
                {SLIDES[index].title}
              </h1>
              <p className="mt-4 font-body text-sm uppercase tracking-[0.25em] text-white/90 sm:text-base">
                {SLIDES[index].subtitle}
              </p>
              <Link
                to={SLIDES[index].to}
                className="mt-8 inline-flex h-12 items-center justify-center border border-white bg-white px-10 font-display text-base tracking-[0.2em] text-black transition-colors hover:bg-transparent hover:text-white"
              >
                {SLIDES[index].cta}
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Minimal indicators — subtle dots that fill with autoplay progress */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2.5 sm:left-auto sm:right-8 sm:translate-x-0 lg:right-12">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className="group flex h-6 items-center"
          >
            {i === index ? (
              <span className="relative h-1.5 w-8 overflow-hidden rounded-full bg-white/30">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{ width: `${progress * 100}%` }}
                />
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-white/40 transition-all duration-300 group-hover:bg-white/70" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
