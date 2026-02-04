import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { Globe } from "lucide-react";

const CurrencySelector = () => {
  const { preferredCurrency, setPreferredCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={preferredCurrency.code}
        onValueChange={(code) => {
          const currency = CURRENCIES.find((c) => c.code === code);
          if (currency) setPreferredCurrency(currency);
        }}
      >
        <SelectTrigger className="w-[120px] bg-background border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySelector;
