// ============================================
// ThemedScreen - Wrapper يطبق الثيم الصحيح
// ============================================
import { useTheme } from '@/context/ThemeContext';
import type { ReactNode } from 'react';

interface ThemedScreenProps {
  children: ReactNode;
  className?: string;
}

export function ThemedScreen({ children, className = '' }: ThemedScreenProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: isDark ? '#0f0f1a' : '#f0f4ff',
        color: isDark ? '#f1f5f9' : '#111827',
      }}
    >
      {children}
    </div>
  );
}

// Helper: بطاقة تدعم الثيم
export function ThemedCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isDark } = useTheme();
  return (
    <div
      className={`rounded-3xl transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: isDark ? '#1e1e32' : '#ffffff',
        borderColor: isDark ? '#2d2d4a' : '#e5e7eb',
      }}
    >
      {children}
    </div>
  );
}

// Helper: Header بخلفية داكنة
export function ThemedHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isDark } = useTheme();
  return (
    <div
      className={`transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
        borderBottomColor: isDark ? '#2d2d4a' : '#e5e7eb',
      }}
    >
      {children}
    </div>
  );
}
