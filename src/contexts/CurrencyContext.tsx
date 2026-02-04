import { createContext, useContext, useState, ReactNode } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate relative to USD
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.36 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", rate: 3.65 },
];

interface CurrencyContextType {
  preferredCurrency: Currency;
  setPreferredCurrency: (currency: Currency) => void;
  convertPrice: (priceUSD: number, fromCurrency?: string) => number;
  formatPrice: (priceUSD: number, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>(CURRENCIES[0]);

  const convertPrice = (price: number, fromCurrency: string = "USD"): number => {
    const fromRate = CURRENCIES.find(c => c.code === fromCurrency)?.rate || 1;
    const priceInUSD = price / fromRate;
    return Math.round(priceInUSD * preferredCurrency.rate);
  };

  const formatPrice = (price: number, fromCurrency: string = "USD"): string => {
    const converted = convertPrice(price, fromCurrency);
    return `${preferredCurrency.symbol}${converted.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        preferredCurrency,
        setPreferredCurrency,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
