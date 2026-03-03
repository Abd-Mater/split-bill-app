import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useLocalStorage, STORAGE_KEYS } from '@/hooks/useLocalStorage';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ── تطبيق الكلاس على <html> و <body> فوراً
function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.style.backgroundColor = '#0a0a12';
    document.body.style.backgroundColor = '#0f0f1a';
    document.body.style.color = '#f1f5f9';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.style.backgroundColor = '#e8ecf5';
    document.body.style.backgroundColor = '#f0f4ff';
    document.body.style.color = '#111827';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // ── القيمة الابتدائية: تتبع localStorage أولاً ثم تفضيل النظام
  const [isDark, setIsDark] = useLocalStorage<boolean>(
    STORAGE_KEYS.THEME,
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // ── تطبيق الثيم عند أي تغيير (useEffect للتأكد من التطبيق الصحيح)
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // ── أيضاً طبّق الثيم فوراً عند التحميل الأولي
  useEffect(() => {
    applyTheme(isDark);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next); // تطبيق فوري بدون انتظار الـ state
      return next;
    });
  }, [setIsDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
