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
  /* The store prices and charges in USD only, so prices are always shown in
     USD. Swapping the currency symbol without converting the amount (the old
     behaviour) displayed "\u20a675" for a $75 item, which is simply wrong.
     Country selection now sets the delivery destination instead. */
  const formatPrice = (amount) => {
    const value = Number(amount) || 0;
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  return <CountryContext.Provider value={{ country, setCountry, formatPrice }}>{children}</CountryContext.Provider>;
}
export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
