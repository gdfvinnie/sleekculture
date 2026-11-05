"use strict";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/data/countries";
const STORAGE_KEY = "sleekculture-country";
export function getStoredCountry() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = COUNTRIES.find((c) => c.code === stored);
      if (found) return found;
    }
  } catch {
  }
  return DEFAULT_COUNTRY;
}
export function storeCountry(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
  }
}
