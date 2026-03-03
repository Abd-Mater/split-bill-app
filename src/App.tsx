import { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { FirebaseProvider, useFirebase } from '@/firebase/FirebaseContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import GoogleLoginScreen from '@/screens/GoogleLoginScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { GroupsScreen } from '@/screens/GroupsScreen';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen';
import { CreateGroupScreen } from '@/screens/CreateGroupScreen';
import { AddBillScreen } from '@/screens/AddBillScreen';
import { MultiBillScreen } from '@/screens/MultiBillScreen';
import { BillCalculatorScreen } from '@/screens/BillCalculatorScreen';
import { BillDetailScreen } from '@/screens/BillDetailScreen';
import { FriendsScreen } from '@/screens/FriendsScreen';
import { AddFriendScreen } from '@/screens/AddFriendScreen';
import { ActivityScreen } from '@/screens/ActivityScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import { BottomNav } from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sun, Moon, Wifi, Loader } from 'lucide-react';

// ── شريط إشعار الثيم
function ThemeBanner() {
  const { isDark } = useTheme();
  return (
    <div
      key={isDark ? 'dark' : 'light'}
      className="fixed top-0 left-0 right-0 z-[998] flex items-center justify-center gap-2 py-1.5 text-xs font-bold pointer-events-none"
      style={{ animation: 'themeBarFade 2s ease-out forwards',
        backgroundColor: isDark ? 'rgba(30,27,75,0.9)' : 'rgba(238,242,255,0.9)',
        color: isDark ? '#a5b4fc' : '#4f46e5' }}
    >
      {isDark
        ? <><Moon className="w-3.5 h-3.5" /> الوضع الليلي مُفعَّل 🌙</>
        : <><Sun className="w-3.5 h-3.5" /> الوضع النهاري مُفعَّل ☀️</>
      }
    </div>
  );
}

// ── رسالة ترحيبية
function WelcomeBanner({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[997] max-w-md mx-auto"
      style={{ animation: 'welcomeBannerAnim 4s ease-out forwards' }}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl px-5 py-4 shadow-2xl flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
          👋
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-base truncate">أهلاً {name}!</p>
          <p className="text-indigo-200 text-xs mt-0.5">مرحباً بك في قسّمها 💰</p>
        </div>
        <button onClick={onDismiss}
          className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}

// ── شريط حالة Firebase (مزامنة)
function FirebaseStatusBar() {
  const { firebaseUser, isFirebaseConnected } = useFirebase();
  const { isDark } = useTheme();

  if (!firebaseUser) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: isFirebaseConnected
          ? (isDark ? '#1a2e1a' : '#dcfce7')
          : (isDark ? '#1e3a5f' : '#dbeafe'),
        color: isFirebaseConnected ? '#22c55e' : '#60a5fa'
      }}>
      {isFirebaseConnected ? (
        <><Wifi className="w-3 h-3" /> متصل بـ Firebase ✓</>
      ) : (
        <><Loader className="w-3 h-3 animate-spin" /> جاري الاتصال...</>
      )}
    </div>
  );
}

function AppScreens() {
  const { currentScreen, navigate } = useApp();
  const { isDark } = useTheme();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':            return <HomeScreen />;
      case 'groups':          return <GroupsScreen />;
      case 'group-detail':    return <GroupDetailScreen />;
      case 'create-group':    return <CreateGroupScreen />;
      case 'add-bill':        return <AddBillScreen />;
      case 'multi-bill':      return <MultiBillScreen />;
      case 'bill-calculator': return <BillCalculatorScreen />;
      case 'bill-detail':     return <BillDetailScreen />;
      case 'friends':         return <FriendsScreen />;
      case 'add-friend':      return <AddFriendScreen />;
      case 'activity':        return <ActivityScreen />;
      case 'notifications':   return <NotificationsScreen onBack={() => navigate('home')} />;
      case 'reports':         return <ReportsScreen onBack={() => navigate('home')} />;
      case 'profile':         return <ProfileScreen />;
      default:                return <HomeScreen />;
    }
  };

  const showNav = !['create-group','add-bill','multi-bill','bill-calculator','bill-detail','add-friend','reports'].includes(currentScreen);

  return (
    <div className="relative min-h-screen transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#0f0f1a' : '#f0f4ff' }}>
      {renderScreen()}
      {showNav && <BottomNav />}
    </div>
  );
}

// ── التطبيق الرئيسي
function MainApp() {
  const { isDark } = useTheme();
  const { firebaseUser, isFirebaseLoading } = useFirebase();

  const [userName, setUserName] = useLocalStorage<string | null>('qassimha_user_name', null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);

  // إذا سجّل دخول بـ Google، احفظ اسمه
  useEffect(() => {
    if (firebaseUser && !userName) {
      setUserName(firebaseUser.displayName);
      setJustLoggedIn(true);
      setShowWelcome(true);
    }
  }, [firebaseUser, userName, setUserName]);

  const handleNameSubmit = useCallback((name: string) => {
    localStorage.removeItem('qassimha_current_user');
    localStorage.removeItem('qassimha_users');
    localStorage.removeItem('qassimha_groups');
    localStorage.removeItem('qassimha_bills');
    setUserName(name);
    setJustLoggedIn(true);
    setShowWelcome(true);
  }, [setUserName]);

  const dismissWelcome = useCallback(() => setShowWelcome(false), []);

  // Loading Firebase
  if (isFirebaseLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#0f0f1a' : '#f0f4ff' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">💰</div>
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            جاري التحقق من الحساب...
          </p>
        </div>
      </div>
    );
  }

  // شاشة Google Login
  if (showGoogleLogin && !userName) {
    return (
      <div className="max-w-md mx-auto min-h-screen relative">
        <GoogleLoginScreen onSkip={() => setShowGoogleLogin(false)} />
      </div>
    );
  }

  // شاشة إدخال الاسم (إذا لم يسجل بـ Google)
  if (!userName) {
    return (
      <div className="max-w-md mx-auto min-h-screen relative">
        <WelcomeScreen
          onComplete={handleNameSubmit}
          onGoogleLogin={() => setShowGoogleLogin(true)}
        />
      </div>
    );
  }

  // التطبيق الرئيسي
  return (
    <AppProvider>
      <NotificationProvider>
        <div className="min-h-screen transition-all duration-300"
          style={{ backgroundColor: isDark ? '#0a0a12' : '#e8ecf5' }}>
          <div className="max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden"
            style={{ backgroundColor: isDark ? '#0f0f1a' : '#f0f4ff' }}>

            <ThemeToggle />

            {/* شريط حالة Firebase */}
            <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[990]">
              <FirebaseStatusBar />
            </div>

            {/* رسالة ترحيب */}
            {showWelcome && justLoggedIn && (
              <WelcomeBanner name={userName} onDismiss={dismissWelcome} />
            )}

            <AppScreens />
          </div>
        </div>
      </NotificationProvider>
    </AppProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <FirebaseProvider>
          <style>{`
            @keyframes themeBarFade {
              0%   { opacity: 1; transform: translateY(0); }
              70%  { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-100%); }
            }
            @keyframes welcomeBannerAnim {
              0%   { opacity: 0; transform: translateY(-20px); }
              8%   { opacity: 1; transform: translateY(0); }
              85%  { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-20px); }
            }
          `}</style>
          <ThemeBanner />
          <MainApp />
        </FirebaseProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
