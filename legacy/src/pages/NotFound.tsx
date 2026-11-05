import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 pt-16 text-center">
        <p className="font-display text-8xl tracking-widest sm:text-9xl">404</p>
        <h1 className="font-display text-2xl tracking-[0.3em]">
          PAGE NOT FOUND
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Try the
          collections through the menu — or head back home.
        </p>
        <Button asChild>
          <Link to="/">BACK HOME</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
