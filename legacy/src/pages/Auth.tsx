import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, UserRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { signIn, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await register(email, password, name);

    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate("/account");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28">
        <div className="w-full max-w-md border border-border bg-card p-8 sm:p-10">
          {/* Toggle */}
          <div className="mb-8 grid grid-cols-2 border border-border">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={
                  mode === m
                    ? "bg-foreground px-4 py-3 font-display text-sm tracking-[0.2em] text-background"
                    : "px-4 py-3 font-display text-sm tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {m === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>
            ))}
          </div>

          <h1 className="mb-6 text-center font-display text-3xl tracking-widest">
            {mode === "signin" ? "WELCOME BACK" : "JOIN SLEEKCULTURE"}
          </h1>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">
                {mode === "signup" ? "Password (8+ characters)" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : 1}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> PLEASE WAIT…
                </>
              ) : mode === "signin" ? (
                "SIGN IN"
              ) : (
                "CREATE ACCOUNT"
              )}
            </Button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" />
            Your session is secured server-side and stays signed in for 30 days.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
