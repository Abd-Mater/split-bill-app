// ============================================
// CurrencyPicker Component - منتقي العملة
// ============================================

import { useState } from 'react';
import { useCurrency, CURRENCIES } from '@/context/CurrencyContext';
import { ChevronDown, X, Check } from 'lucide-react';

interface CurrencyPickerProps {
  compact?: boolean; // compact = زر صغير بالرمز فقط
  className?: string;
}

export function CurrencyPicker({ compact = false, className = '' }: CurrencyPickerProps) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm rounded-2xl transition-all active:scale-95 ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } ${className}`}
      >
        <span className="text-base">{currency.flag}</span>
        <span className={`font-black text-white ${compact ? 'text-xs' : 'text-sm'}`}>
          {currency.code}
        </span>
        <ChevronDown className={`text-white/70 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white dark:bg-[#1a1a2e] rounded-t-3xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-2">
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">اختر العملة</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Currency List */}
            <div className="px-4 pb-10 space-y-2 max-h-[60vh] overflow-y-auto">
              {CURRENCIES.map((c) => {
                const isSelected = c.code === currency.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c); setOpen(false); }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15'
                        : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#1e1e32] hover:border-gray-200 dark:hover:border-[#3d3d5a]'
                    }`}
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <div className="flex-1 text-right">
                      <p className="font-black text-gray-900 dark:text-gray-100 text-sm">{c.nameAr}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.code} • {c.symbol}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-[#2a2a3e]'
                    }`}>
                      {isSelected
                        ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        : <span className="text-sm font-black text-gray-500 dark:text-gray-400">{c.symbol}</span>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
