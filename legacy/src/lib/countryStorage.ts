import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/data/countries";

const STORAGE_KEY = "sleekculture-country";

export function getStoredCountry(): Country {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = COUNTRIES.find((c) => c.code === stored);
      if (found) return found;
    }
  } catch {
    // localStorage unavailable — use default
  }
  return DEFAULT_COUNTRY;
}

export function storeCountry(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore write failures
  }
}
