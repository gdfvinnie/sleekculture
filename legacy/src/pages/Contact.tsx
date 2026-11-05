import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Instagram, Mail, Phone } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Newsletter } from "@/components/Newsletter";
import { LagosMap } from "@/components/LagosMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

const EMAIL = "jnrvinnie@gmail.com";
const PHONE = "+234 8169282171";
const INSTAGRAM_URL = "https://www.instagram.com/sleekculture";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const CHANNELS = [
  {
    icon: Mail,
    label: "EMAIL",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
  },
  {
    icon: Phone,
    label: "PHONE",
    value: PHONE,
    href: `tel:${PHONE.replace(/\s/g, "")}`,
  },
  {
    icon: Instagram,
    label: "INSTAGRAM",
    value: "@sleekculture",
    href: INSTAGRAM_URL,
  },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes("@") || !message.trim()) {
      toast({
        title: "MISSING DETAILS",
        description: "Fill in your name, a valid email, and a message.",
        variant: "destructive",
      });
      return;
    }
    // Hand off to the mail client with the message prefilled
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `Message from ${name}`,
    )}&body=${encodeURIComponent(`${message}\n\n— ${name} (${email})`)}`;
    toast({
      title: "OPENING YOUR MAIL APP",
      description: `Your message is addressed to ${EMAIL}.`,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <section className="px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24">
          <motion.p
            {...fadeUp}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent"
          >
            GET IN TOUCH
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="font-display text-6xl leading-none tracking-wide sm:text-7xl lg:text-8xl"
          >
            CONTACT
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.16 }}
            className="mx-auto mt-6 max-w-md text-sm uppercase tracking-[0.25em] text-muted-foreground"
          >
            Orders, sizing, collabs — we answer everything.
          </motion.p>
        </section>

        {/* Channels */}
        <section className="border-y border-border bg-card">
          <div className="px-4 py-12 sm:px-6 lg:px-10">
            <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
              {CHANNELS.map((c, i) => (
                <motion.a
                  key={c.label}
                  href={c.href}
                  target={c.label === "INSTAGRAM" ? "_blank" : undefined}
                  rel={c.label === "INSTAGRAM" ? "noreferrer" : undefined}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.06 * i }}
                  className="group flex flex-col gap-4 bg-background p-8 transition-colors hover:bg-secondary sm:p-10"
                >
                  <div className="flex items-center justify-between">
                    <c.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-accent" />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      {c.label}
                    </p>
                    <p className="mt-2 break-all font-display text-xl tracking-[0.08em] sm:text-2xl">
                      {c.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Message form + location */}
        <section className="grid gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-10">
          <motion.div {...fadeUp}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              SEND A MESSAGE
            </p>
            <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
              TALK TO US
            </h2>
            <form onSubmit={send} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="c-name">Name</Label>
                  <Input
                    id="c-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="c-message">Message</Label>
                <Textarea
                  id="c-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                SEND MESSAGE
              </Button>
            </form>
          </motion.div>

          <motion.div {...fadeUp} className="flex flex-col justify-between gap-8">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                STUDIO
              </p>
              <h3 className="font-display text-4xl tracking-wide sm:text-5xl">
                LAGOS, NIGERIA
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Our home base — where every drop is designed and shipped from.
                Local pickup and worldwide delivery available.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Response time: usually within 24 hours, Monday–Saturday.
              </p>
            </div>
            <LagosMap className="h-56 sm:h-64" />
          </motion.div>
        </section>
      </main>

      <Newsletter />
      <Footer />
    </div>
  );
}
