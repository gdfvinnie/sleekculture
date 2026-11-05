import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountry } from "@/context/CountryContext";
import { COUNTRIES } from "@/data/countries";

export function CountrySelector() {
  const { country, setCountry } = useCountry();

  return (
    <Select value={country.code} onValueChange={setCountry}>
      <SelectTrigger
        className="h-9 w-auto gap-1.5 border-none bg-transparent px-2 text-xs uppercase tracking-wider shadow-none focus:ring-0"
        aria-label="Select country"
      >
        <Globe className="h-4 w-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="max-h-80">
        {COUNTRIES.map((c) => (
          <SelectItem key={c.code} value={c.code} className="text-xs">
            <span className="flex items-center gap-2">
              <span className="w-7 text-[10px] font-semibold tracking-widest text-muted-foreground">
                {c.code}
              </span>
              <span>{c.name}</span>
              {!c.shipsTo && (
                <span className="text-[10px] text-muted-foreground">*</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
