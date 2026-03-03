// ============================================
// Currency Context - اختيار العملة
// ============================================

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Currency {
  code: string;
  symbol: string;
  nameAr: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'SAR', symbol: 'ر.س', nameAr: 'ريال سعودي',    flag: '🇸🇦' },
  { code: 'USD', symbol: '$',    nameAr: 'دولار أمريكي',  flag: '🇺🇸' },
  { code: 'EGP', symbol: 'ج.م', nameAr: 'جنيه مصري',    flag: '🇪🇬' },
  { code: 'AED', symbol: 'د.إ', nameAr: 'درهم إماراتي', flag: '🇦🇪' },
  { code: 'KWD', symbol: 'د.ك', nameAr: 'دينار كويتي',  flag: '🇰🇼' },
  { code: 'QAR', symbol: 'ر.ق', nameAr: 'ريال قطري',    flag: '🇶🇦' },
  { code: 'JOD', symbol: 'د.أ', nameAr: 'دينار أردني',  flag: '🇯🇴' },
  { code: 'EUR', symbol: '€',   nameAr: 'يورو',          flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',   nameAr: 'جنيه إسترليني',flag: '🇬🇧' },
  { code: 'TRY', symbol: '₺',   nameAr: 'ليرة تركية',   flag: '🇹🇷' },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatAmount: (amount: number, decimals?: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyRaw] = useLocalStorage<Currency>(
    'qassimha_currency',
    CURRENCIES[0] // SAR default
  );

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyRaw(c);
  }, [setCurrencyRaw]);

  // مبلغ + رمز العملة
  const formatAmount = useCallback((amount: number, decimals = 1): string => {
    const rounded = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${rounded.toFixed(decimals)} ${currency.symbol}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, symbol: currency.symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
