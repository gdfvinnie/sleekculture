import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { COUNTRIES, type Country } from "@/data/countries";
import { getStoredCountry, storeCountry } from "@/lib/countryStorage";

interface CountryContextValue {
  country: Country;
  setCountry: (code: string) => void;
  formatPrice: (amount: number) => string;
}

const CountryContext = createContext<CountryContextValue | undefined>(
  undefined,
);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<Country>(() =>
    getStoredCountry(),
  );

  useEffect(() => {
    storeCountry(country.code);
  }, [country]);

  const setCountry = (code: string) => {
    const next = COUNTRIES.find((c) => c.code === code);
    if (next) setCountryState(next);
  };

  /** Formats a USD base price with the selected country's currency symbol. */
  const formatPrice = (amount: number): string => {
    // Japan and Korea traditionally omit decimals for ¥/₩
    const noDecimals = country.code === "JP" || country.code === "KR";
    const rounded = noDecimals ? Math.round(amount) : amount;
    return `${country.symbol}${rounded.toLocaleString(undefined, {
      minimumFractionDigits: noDecimals ? 0 : 2,
      maximumFractionDigits: noDecimals ? 0 : 2,
    })}`;
  };

  return (
    <CountryContext.Provider value={{ country, setCountry, formatPrice }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
