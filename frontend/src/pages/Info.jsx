"use strict";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

/**
 * Static information pages (shipping, size guide, FAQ, privacy, terms).
 *
 * These routes are linked from every footer, so they must exist: a dead link
 * on a store's legal pages is a credibility problem. Copy stays consistent
 * with the policies stated on the product page and checkout (free delivery
 * over $150, $25 standard, 3–7 business days, 30-day returns).
 */

const SUPPORT_EMAIL = "jnrvinnie@gmail.com";

const PAGES = {
  shipping: {
    eyebrow: "HELP",
    title: "SHIPPING & RETURNS",
    intro:
      "Everything about how sleekculture orders reach you, and what happens if something isn't right.",
    sections: [
      {
        heading: "DELIVERY",
        body: [
          "Orders are packed and dispatched from Lagos. Standard delivery takes 3–7 business days; express takes 1–3 business days where available.",
          "Delivery is free on orders of $150 or more. Below that, a flat $25 delivery fee applies — the exact amount is always shown at checkout before you pay.",
        ],
      },
      {
        heading: "ORDER PROCESSING",
        body: [
          "Orders placed before 2pm (WAT) on a business day are usually packed the same day. You will receive your order number as soon as the order is placed.",
          "Bank-transfer and pay-on-delivery orders are dispatched once payment is confirmed. Card orders are confirmed automatically.",
        ],
      },
      {
        heading: "RETURNS",
        body: [
          "You have 30 days from delivery to return unworn items with their tags attached.",
          "To start a return, email us with your order number and what you'd like to return. Refunds go back to the original payment method within 5 business days of the item arriving back with us.",
          "Items that have been worn, washed, or altered are not eligible for a refund.",
        ],
      },
      {
        heading: "QUESTIONS",
        body: [
          `Email ${SUPPORT_EMAIL} with your order number and we'll get back to you.`,
        ],
      },
    ],
  },
  "size-guide": {
    eyebrow: "FIT",
    title: "SIZE GUIDE",
    intro:
      "Our pieces are cut to a relaxed, true-to-size fit. Pick your usual size; go up one if you prefer extra room.",
    sections: [
      {
        heading: "HOW TO MEASURE",
        body: [
          "Chest: measure around the fullest part of your chest, keeping the tape level under your arms.",
          "Length: measure from the highest point of the shoulder straight down to the hem.",
          "Take the measurements over light clothing and keep the tape snug but not tight.",
        ],
      },
      {
        heading: "BETWEEN TWO SIZES?",
        body: [
          "Hoodies and tees are cut generously — if you prefer a closer fit, take the smaller size. If you're layering, take the larger one.",
          "Caps are one size and adjust at the back.",
        ],
      },
      {
        heading: "EXACT MEASUREMENTS",
        body: [
          `We'd rather send you the real numbers than guess. Email ${SUPPORT_EMAIL} with the piece you're looking at and we'll send you its flat measurements.`,
        ],
      },
    ],
  },
  faq: {
    eyebrow: "HELP",
    title: "FREQUENTLY ASKED QUESTIONS",
    intro: "The short answers to what customers ask most.",
    sections: [
      {
        heading: "HOW LONG DOES DELIVERY TAKE?",
        body: [
          "Standard delivery is 3–7 business days, express 1–3. Orders over $150 ship free.",
        ],
      },
      {
        heading: "WHAT PAYMENT METHODS DO YOU ACCEPT?",
        body: [
          "Bank transfer and pay on delivery are available at checkout. Card payment is being connected and appears once it is live.",
        ],
      },
      {
        heading: "HOW DO I TRACK MY ORDER?",
        body: [
          "Keep the order number shown on your confirmation page. Email us with that number and we'll send the current status.",
        ],
      },
      {
        heading: "CAN I CHANGE OR CANCEL AN ORDER?",
        body: [
          `If the order has not shipped yet, email ${SUPPORT_EMAIL} as soon as possible and we'll adjust it.`,
        ],
      },
      {
        heading: "HOW DO RETURNS WORK?",
        body: [
          "You have 30 days from delivery for unworn items with tags. See the shipping & returns page for the full process.",
        ],
      },
    ],
  },
  privacy: {
    eyebrow: "LEGAL",
    title: "PRIVACY POLICY",
    intro:
      "This policy explains what sleekculture collects when you shop with us, and what we do with it.",
    sections: [
      {
        heading: "WHAT WE COLLECT",
        body: [
          "When you place an order: your name, email address, phone number, delivery address, order contents and total.",
          "When you create an account: your email address and a password stored as a one-way bcrypt hash — we never store the password itself.",
          "Technical data: a session cookie so you stay signed in, and basic request logs used to keep the store secure.",
        ],
      },
      {
        heading: "HOW WE USE IT",
        body: [
          "To process and deliver your order, to answer your questions, and to keep records of sales.",
          "We do not sell customer data, and we do not share it with third parties except where needed to fulfil an order (for example a delivery partner).",
        ],
      },
      {
        heading: "COOKIES",
        body: [
          "We set a strictly necessary session cookie when you sign in. Your bag and country preference are stored in your own browser's local storage.",
          "No advertising or cross-site tracking cookies are used.",
        ],
      },
      {
        heading: "YOUR RIGHTS",
        body: [
          `You can ask for a copy of the data we hold about you, or ask us to delete your account, by emailing ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: "SECURITY",
        body: [
          "Sessions are httpOnly cookies, passwords are bcrypt-hashed, and admin functions require a separate authenticated session.",
        ],
      },
    ],
  },
  terms: {
    eyebrow: "LEGAL",
    title: "TERMS OF SERVICE",
    intro:
      "These terms apply when you buy from sleekculture. Placing an order means you accept them.",
    sections: [
      {
        heading: "ORDERS",
        body: [
          "An order is an offer to buy. We confirm it once payment is received (or, for pay-on-delivery, once it is accepted for dispatch).",
          "If an item turns out to be unavailable, we will contact you and refund any amount already paid for it.",
        ],
      },
      {
        heading: "PRICES AND PAYMENT",
        body: [
          "Prices are shown before you pay, in the currency displayed at checkout. Delivery is charged separately and shown in the order summary.",
          "We never ask you to send payment details over social media or messaging apps.",
        ],
      },
      {
        heading: "DELIVERY",
        body: [
          "Delivery estimates are given in good faith but are not guaranteed — courier delays can happen.",
          "Risk passes to you on delivery.",
        ],
      },
      {
        heading: "RETURNS",
        body: [
          "Our 30-day returns policy is set out on the shipping & returns page and forms part of these terms.",
        ],
      },
      {
        heading: "CONTENT",
        body: [
          "All product photography, copy and branding on this site belong to sleekculture and may not be reused without permission.",
        ],
      },
      {
        heading: "CONTACT",
        body: [`Questions about these terms: ${SUPPORT_EMAIL}.`],
      },
    ],
  },
};

export default function Info({ page }) {
  const content = PAGES[page] ?? PAGES.faq;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-24 pt-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {content.eyebrow}
          </p>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{content.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {content.intro}
          </p>
          <div className="mt-12 divide-y divide-border border-y border-border">
            {content.sections.map((section) => (
              <section key={section.heading} className="py-7">
                <h2 className="font-display text-lg tracking-widest">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/shop">CONTINUE SHOPPING</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">CONTACT US</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
