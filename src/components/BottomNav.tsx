import { useApp } from '@/context/AppContext';
import { Home, Users, Receipt, User } from 'lucide-react';
import type { Screen } from '@/types';

const navItems: { screen: Screen; icon: typeof Home; label: string }[] = [
  { screen: 'home',     icon: Home,    label: 'الرئيسية'  },
  { screen: 'groups',   icon: Users,   label: 'المجموعات' },
  { screen: 'activity', icon: Receipt, label: 'النشاط'    },
  { screen: 'profile',  icon: User,    label: 'حسابي'     },
];

export function BottomNav() {
  const { currentScreen, navigate } = useApp();

  const isActive = (screen: Screen) => {
    if (screen === 'home')     return currentScreen === 'home';
    if (screen === 'groups')   return ['groups', 'group-detail', 'create-group', 'add-bill', 'bill-detail'].includes(currentScreen);
    if (screen === 'activity') return currentScreen === 'activity';
    if (screen === 'profile')  return ['profile', 'friends', 'add-friend'].includes(currentScreen);
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-md bg-white/95 dark:bg-[#1a1a2e]/95 backdrop-blur-2xl border-t border-gray-200/60 dark:border-[#2d2d4a]/80 px-4 pb-7 pt-3 shadow-2xl shadow-black/8 dark:shadow-black/40">

        {/* Top highlight line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const active = isActive(item.screen);
            return (
              <button
                key={item.screen}
                onClick={() => navigate(item.screen)}
                className="nav-item flex flex-col items-center gap-1 py-1 px-3 rounded-2xl relative"
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce-in" />
                )}

                <div className={`
                  w-12 h-10 rounded-2xl flex items-center justify-center transition-all duration-200
                  ${active
                    ? 'bg-indigo-500 shadow-lg shadow-indigo-500/35'
                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                  }
                `}>
                  <item.icon
                    className={`w-5 h-5 transition-all ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </div>
                <span className={`text-[10px] font-bold transition-all ${
                  active ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
