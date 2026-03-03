// ============================================
// useThemeColors - hook يعطي ألوان حسب الثيم
// ============================================
import { useTheme } from '@/context/ThemeContext';

export function useThemeColors() {
  const { isDark } = useTheme();

  return {
    isDark,
    // Backgrounds
    bgPage:    isDark ? '#0f0f1a' : '#f0f4ff',
    bgCard:    isDark ? '#1e1e32' : '#ffffff',
    bgCard2:   isDark ? '#1a1a2e' : '#ffffff',
    bgInput:   isDark ? '#2a2a3e' : '#f3f4f6',
    bgHover:   isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
    bgOverlay: isDark ? '#0a0a12' : '#e8ecf5',

    // Borders
    border:    isDark ? '#2d2d4a' : '#e5e7eb',
    border2:   isDark ? '#3d3d5a' : '#d1d5db',

    // Text
    textPrimary:   isDark ? '#f1f5f9' : '#111827',
    textSecondary: isDark ? '#94a3b8' : '#6b7280',
    textMuted:     isDark ? '#64748b' : '#9ca3af',

    // Tailwind class helpers
    tw: {
      bg:      isDark ? 'bg-[#0f0f1a]'   : 'bg-[#f0f4ff]',
      card:    isDark ? 'bg-[#1e1e32]'   : 'bg-white',
      card2:   isDark ? 'bg-[#1a1a2e]'   : 'bg-white',
      input:   isDark ? 'bg-[#2a2a3e]'   : 'bg-gray-50',
      border:  isDark ? 'border-[#2d2d4a]' : 'border-gray-200',
      border2: isDark ? 'border-[#3d3d5a]' : 'border-gray-100',
      text:    isDark ? 'text-gray-100'  : 'text-gray-900',
      textSub: isDark ? 'text-gray-400'  : 'text-gray-500',
      hover:   isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50',
      divide:  isDark ? 'divide-[#2d2d4a]' : 'divide-gray-100',
    },
  };
}
