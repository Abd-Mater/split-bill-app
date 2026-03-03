// ============================================
// useLocalStorage Hook - حفظ البيانات تلقائياً
// ============================================
// يعمل مثل useState بالضبط، لكن يحفظ القيمة
// في localStorage تلقائياً عند كل تغيير

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // ── قراءة القيمة من localStorage عند أول تشغيل
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return initialValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`useLocalStorage: خطأ في قراءة "${key}":`, error);
      return initialValue;
    }
  });

  // ── حفظ القيمة في localStorage عند كل تغيير
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`useLocalStorage: خطأ في حفظ "${key}":`, error);
    }
  }, [key, storedValue]);

  // ── دالة التحديث (تدعم callback مثل setState)
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;
      return next;
    });
  }, []);

  // ── دالة مسح القيمة وإعادة الضبط
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`useLocalStorage: خطأ في حذف "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// ── مفاتيح الـ localStorage المستخدمة في التطبيق
export const STORAGE_KEYS = {
  THEME:        'qassimha_theme',
  AUTH_USER:    'qassimha_auth_user',
  AUTH_PHONE:   'qassimha_auth_phone',
  GROUPS:       'qassimha_groups',
  BILLS:        'qassimha_bills',
  USERS:        'qassimha_users',
  FRIENDS:      'qassimha_friends',
  SETTLEMENTS:  'qassimha_settlements',
  CURRENT_USER: 'qassimha_current_user',
  LAST_SCREEN:  'qassimha_last_screen',
} as const;

// ── دالة مساعدة: مسح كل بيانات التطبيق
export function clearAllAppData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
}

// ── دالة مساعدة: حجم البيانات المحفوظة
export function getStorageSize(): string {
  try {
    let total = 0;
    Object.values(STORAGE_KEYS).forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) total += item.length * 2; // UTF-16 = 2 bytes per char
    });
    if (total < 1024) return `${total} B`;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    return `${(total / 1024 / 1024).toFixed(1)} MB`;
  } catch {
    return '0 B';
  }
}
