import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/context/CountryContext";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const { data: products = [] } = useProducts();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, products]);

  const go = (id: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(`/product/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle>SEARCH</DialogTitle>
          <DialogDescription className="sr-only">
            Search the catalog
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories…"
              className="pl-11"
            />
          </div>

          {results.length > 0 && (
            <ul className="mt-4 max-h-80 divide-y divide-border overflow-y-auto">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => go(p.id)}
                    className="flex w-full items-center gap-4 p-2 text-left transition-colors hover:bg-secondary"
                  >
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      loading="lazy"
                      className="h-16 w-12 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium uppercase tracking-wide">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.category}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatPrice(p.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && results.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No products match "{query}".
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
