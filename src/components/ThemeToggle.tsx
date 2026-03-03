import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
      className={`
        fixed top-4 left-4 z-[999]
        w-12 h-12 rounded-2xl
        flex items-center justify-center
        shadow-xl backdrop-blur-md
        transition-all duration-300
        active:scale-90 hover:scale-110
        border-2
        ${isDark
          ? 'bg-[#1e1e32] border-indigo-500/50 text-yellow-300 shadow-indigo-900/50 hover:bg-indigo-500/20'
          : 'bg-white border-gray-200 text-gray-700 shadow-gray-200/80 hover:bg-indigo-50 hover:border-indigo-300'
        }
      `}
      title={isDark ? 'الوضع النهاري ☀️' : 'الوضع الليلي 🌙'}
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-400 animate-spin-slow" style={{ animationDuration: '6s' }} />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600" />
        )}
      </div>
    </button>
  );
}
