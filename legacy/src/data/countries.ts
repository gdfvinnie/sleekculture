export interface Country {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  shipsTo: boolean;
}

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", currency: "USD", symbol: "$", shipsTo: true },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£", shipsTo: true },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "$", shipsTo: true },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "$", shipsTo: true },
  { code: "DE", name: "Germany", currency: "EUR", symbol: "€", shipsTo: true },
  { code: "FR", name: "France", currency: "EUR", symbol: "€", shipsTo: true },
  { code: "JP", name: "Japan", currency: "JPY", symbol: "¥", shipsTo: true },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦", shipsTo: true },
  { code: "GH", name: "Ghana", currency: "GHS", symbol: "GH₵", shipsTo: true },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R", shipsTo: true },
  { code: "KE", name: "Kenya", currency: "KES", symbol: "KSh", shipsTo: true },
  { code: "IN", name: "India", currency: "INR", symbol: "₹", shipsTo: true },
  { code: "BR", name: "Brazil", currency: "BRL", symbol: "R$", shipsTo: true },
  { code: "AE", name: "United Arab Emirates", currency: "AED", symbol: "د.إ", shipsTo: true },
  { code: "SG", name: "Singapore", currency: "SGD", symbol: "S$", shipsTo: true },
  { code: "KR", name: "South Korea", currency: "KRW", symbol: "₩", shipsTo: true },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "MX$", shipsTo: true },
  { code: "SE", name: "Sweden", currency: "SEK", symbol: "kr", shipsTo: true },
  { code: "IT", name: "Italy", currency: "EUR", symbol: "€", shipsTo: true },
  { code: "NL", name: "Netherlands", currency: "EUR", symbol: "€", shipsTo: true },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // United States
