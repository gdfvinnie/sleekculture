"use strict";
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { COUNTRIES } from "@/data/countries";
import { getStoredCountry, storeCountry } from "@/lib/countryStorage";
const CountryContext = createContext(
  void 0
);
export function CountryProvider({ children }) {
  const [country, setCountryState] = useState(
    () => getStoredCountry()
  );
  useEffect(() => {
    storeCountry(country.code);
  }, [country]);
  const setCountry = (code) => {
    const next = COUNTRIES.find((c) => c.code === code);
    if (next) setCountryState(next);
  };
  const formatPrice = (amount) => {
    const noDecimals = country.code === "JP" || country.code === "KR";
    const rounded = noDecimals ? Math.round(amount) : amount;
    return `${country.symbol}${rounded.toLocaleString(void 0, {
      minimumFractionDigits: noDecimals ? 0 : 2,
      maximumFractionDigits: noDecimals ? 0 : 2
    })}`;
  };
  return <CountryContext.Provider value={{ country, setCountry, formatPrice }}>{children}</CountryContext.Provider>;
}
export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
