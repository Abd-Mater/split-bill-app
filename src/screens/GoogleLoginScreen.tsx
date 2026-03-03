import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFirebase } from '../firebase/FirebaseContext';

const GoogleLoginScreen: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const { isDark } = useTheme();
  const { loginWithGoogle, isFirebaseLoading, firebaseError } = useFirebase();
  const isFirebaseEnabled = true; // Firebase جاهز دائماً
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLocalError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setLocalError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const bg = isDark ? '#0f0f1a' : '#f0f4ff';
  const card = isDark ? '#1e1e32' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#1e293b';
  const subText = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#2d2d4a' : '#e2e8f0';

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh' }}
      className="flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8 animate-bounce-in">
          <div className="w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center text-5xl shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            💰
          </div>
          <h1 className="text-3xl font-black mb-1" style={{ color: text }}>قسّمها</h1>
          <p style={{ color: subText }} className="text-sm">تقسيم الفواتير بين الأصدقاء</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 shadow-2xl stagger-1"
          style={{ backgroundColor: card, border: `1px solid ${border}` }}>

          <h2 className="text-xl font-bold text-center mb-2" style={{ color: text }}>
            أهلاً بك! 👋
          </h2>
          <p className="text-center text-sm mb-6" style={{ color: subText }}>
            سجّل دخولك لحفظ بياناتك على جميع أجهزتك
          </p>

          {/* Firebase Not Configured Warning */}
          {!isFirebaseEnabled && (
            <div className="rounded-2xl p-4 mb-4 text-center"
              style={{ backgroundColor: isDark ? '#2a1f0a' : '#fff8e6', border: '1px solid #f59e0b' }}>
              <p className="text-2xl mb-2">⚠️</p>
              <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>Firebase غير مُعدّ بعد</p>
              <p className="text-xs mt-1" style={{ color: subText }}>
                أضف بيانات مشروعك في ملف config.ts
              </p>
            </div>
          )}

          {/* Error Message */}
          {(firebaseError || localError) && (
            <div className="rounded-2xl p-3 mb-4 flex items-center gap-2"
              style={{ backgroundColor: isDark ? '#2d1b1b' : '#fef2f2', border: '1px solid #ef4444' }}>
              <span>❌</span>
              <p className="text-sm" style={{ color: '#ef4444' }}>
                {firebaseError || localError}
              </p>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || isFirebaseLoading || !isFirebaseEnabled}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 mb-3"
            style={{
              backgroundColor: isFirebaseEnabled ? (isDark ? '#1a1a2e' : '#ffffff') : (isDark ? '#1a1a2e' : '#f8fafc'),
              color: isFirebaseEnabled ? text : subText,
              border: `2px solid ${isFirebaseEnabled ? border : border}`,
              opacity: (!isFirebaseEnabled || isLoading) ? 0.6 : 1,
              transform: isLoading ? 'scale(0.98)' : 'scale(1)',
              boxShadow: isFirebaseEnabled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
            }}>
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                {/* Google Logo SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>تسجيل الدخول بـ Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: border }} />
            <span className="text-xs" style={{ color: subText }}>أو</span>
            <div className="flex-1 h-px" style={{ backgroundColor: border }} />
          </div>

          {/* Skip Button */}
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-2xl font-medium text-sm transition-all duration-200"
            style={{
              backgroundColor: isDark ? '#2d2d4a' : '#f1f5f9',
              color: subText,
            }}>
            متابعة بدون تسجيل دخول (محلي فقط) 🔒
          </button>
        </div>

        {/* Firebase Setup Guide */}
        {!isFirebaseEnabled && (
          <div className="mt-4 rounded-2xl p-4 stagger-2"
            style={{ backgroundColor: isDark ? '#1a1a2e' : '#f8faff', border: `1px solid ${border}` }}>
            <p className="text-sm font-bold mb-3 text-center" style={{ color: text }}>
              🔧 خطوات إعداد Firebase
            </p>
            {[
              { num: '1', text: 'اذهب إلى console.firebase.google.com' },
              { num: '2', text: 'أنشئ مشروعاً جديداً أو افتح مشروعك' },
              { num: '3', text: 'فعّل Google Authentication من Authentication > Sign-in method' },
              { num: '4', text: 'أنشئ Firestore Database في وضع Test Mode' },
              { num: '5', text: 'اذهب لـ Project Settings > Your apps > Web App' },
              { num: '6', text: 'انسخ firebaseConfig وضعه في src/firebase/config.ts' },
            ].map(step => (
              <div key={step.num} className="flex items-start gap-2 mb-2">
                <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: '#6366f1', color: '#fff' }}>
                  {step.num}
                </span>
                <p className="text-xs" style={{ color: subText }}>{step.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-center text-xs mt-4" style={{ color: subText }}>
          🔐 بياناتك محمية ومخزّنة بشكل آمن على Firebase
        </p>
      </div>
    </div>
  );
};

export default GoogleLoginScreen;
