"use strict";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const subscribe = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast({
        title: "INVALID EMAIL",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    setSending(true);
    try {
      /* Saved server-side so the promise "you're on the list" is true. */
      await api.newsletter(email.trim());
      toast({
        title: "SUBSCRIBED",
        description: "You're on the list for drops and editorials."
      });
      setEmail("");
    } catch {
      toast({
        title: "COULD NOT SUBSCRIBE",
        description:
          "This build has no store server attached yet. Email us and we'll add you to the list.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  return <section className="bg-foreground py-20 text-background"><div className="mx-auto max-w-2xl px-4 text-center sm:px-6"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          NEWSLETTER
        </p><h2 className="font-display text-4xl tracking-wide sm:text-5xl">
          JOIN THE CULTURE
        </h2><p className="mt-4 text-sm text-white/70">
          Early access to drops, editorials, and private sales. No spam — ever.
        </p><form
    onSubmit={subscribe}
    className="mx-auto mt-8 flex max-w-md gap-2"
  ><Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="your@email.com"
    className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
  /><Button
    type="submit"
    disabled={sending}
    className="bg-white text-black hover:bg-white/80"
  >
            {sending ? "JOINING…" : "SUBSCRIBE"}
          </Button></form></div></section>;
}
