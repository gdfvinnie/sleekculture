import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/sleekculture";

const SHOP_LINKS = [
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/shop", label: "Shop All" },
  { to: "/shop?subcategory=T-Shirts", label: "T-Shirts" },
  { to: "/shop?subcategory=Hoodies", label: "Hoodies" },
  { to: "/shop?category=Accessories", label: "Accessories" },
];

const INFO_LINKS = [
  { to: "/foundation", label: "Sleek Foundation" },
  { to: "/contact", label: "Contact" },
  { to: "/shipping", label: "Shipping & Returns" },
  { to: "/size-guide", label: "Size Guide" },
  { to: "/faq", label: "FAQ" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="grid grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
        {/* Brand */}
        <div>
          <Link to="/" aria-label="sleekculture — home">
            <img
              src="/sleekculture-logo.png"
              alt="sleekculture"
              className="h-9 w-32 object-cover object-center mix-blend-multiply"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Lagos-born streetwear for the worldwide culture. Considered cuts,
            heavyweight fabrics, quiet confidence.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="sleekculture on Instagram"
              className="inline-flex h-9 w-9 items-center justify-center border border-border transition-colors hover:border-foreground"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <p className="font-display text-base tracking-widest">SHOP</p>
          <ul className="mt-4 space-y-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <p className="font-display text-base tracking-widest">INFO</p>
          <ul className="mt-4 space-y-2.5">
            {INFO_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="font-display text-base tracking-widest">CONTACT</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a
                href="mailto:jnrvinnie@gmail.com"
                className="break-all transition-colors hover:text-foreground"
              >
                jnrvinnie@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a
                href="tel:+2348169282171"
                className="transition-colors hover:text-foreground"
              >
                +234 8169282171
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-4 w-4 shrink-0" />
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                @sleekculture
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-10">
          <p>© {new Date().getFullYear()} SLEEKCULTURE. Lagos → Worldwide.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
