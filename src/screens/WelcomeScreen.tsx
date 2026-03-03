import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowLeft, User, Receipt, Users, TrendingUp } from 'lucide-react';

interface WelcomeScreenProps {
  onComplete: (name: string) => void;
  onGoogleLogin?: () => void;
}

export function WelcomeScreen({ onComplete, onGoogleLogin }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('يرجى إدخال اسمك');
      return;
    }
    if (trimmed.length < 2) {
      setError('الاسم قصير جداً (حرفان على الأقل)');
      return;
    }
    if (trimmed.length > 50) {
      setError('الاسم طويل جداً');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // محاكاة تأخير بسيط للأنيميشن
    setTimeout(() => {
      onComplete(trimmed);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 animate-gradient relative overflow-hidden" dir="rtl">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-indigo-300/10 rounded-full blur-3xl" />

        {/* Floating icons */}
        <div className="absolute top-24 right-8 animate-float" style={{ animationDelay: '0s' }}>
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white/60" />
          </div>
        </div>
        <div className="absolute top-40 left-6 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white/60" />
          </div>
        </div>
        <div className="absolute top-16 left-1/3 animate-float" style={{ animationDelay: '2s' }}>
          <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white/60" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md mx-auto px-5 pt-20 pb-8 min-h-screen flex flex-col">
        {/* Logo & Title */}
        <div className="text-center mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/15 backdrop-blur-lg rounded-3xl mb-6 shadow-xl shadow-indigo-900/20 relative">
            <span className="text-5xl">💰</span>
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">قسّمها</h1>
          <p className="text-indigo-200 text-lg font-medium">قسّم فواتيرك مع أصدقائك بسهولة</p>
        </div>

        {/* Feature badges */}
        <div className="flex justify-center gap-2 mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {[
            { icon: '⚡', text: 'سريع' },
            { icon: '🔒', text: 'آمن' },
            { icon: '🆓', text: 'مجاني' },
          ].map((badge) => (
            <div
              key={badge.text}
              className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2"
            >
              <span className="text-base">{badge.icon}</span>
              <span className="text-white/90 text-sm font-bold">{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Name Input Card */}
        <div
          className={`bg-white rounded-3xl shadow-2xl shadow-indigo-900/30 p-7 flex-shrink-0 animate-slide-up transition-all ${
            isSubmitting ? 'scale-95 opacity-70' : ''
          }`}
          style={{ animationDelay: '0.3s' }}
        >
          {/* Card Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl mb-4">
              <User className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">أهلاً بك! 👋</h2>
            <p className="text-gray-500 text-base mt-2">أخبرنا باسمك عشان نبدأ</p>
          </div>

          {/* Name Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                اسمك الكريم
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="مثال: أحمد محمد"
                className={`w-full border-2 rounded-2xl px-5 py-4 text-right text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 transition-all text-lg font-medium ${
                  error
                    ? 'border-red-400 bg-red-50/50 focus:border-red-400 focus:ring-red-100 animate-shake'
                    : 'border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-100 focus:bg-white'
                }`}
                dir="rtl"
                disabled={isSubmitting}
                autoComplete="name"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 animate-slide-up">
                <span className="text-sm font-bold">⚠️ {error}</span>
              </div>
            )}

            {/* Preview */}
            {name.trim() && !error && (
              <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4 flex items-center gap-3 animate-scale-in">
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/30">
                  {name.trim()[0]}
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base">{name.trim()}</p>
                  <p className="text-xs text-indigo-500 font-medium mt-0.5">مرحباً بك في قسّمها! 💜</p>
                </div>
              </div>
            )}

            {/* Google Login Button */}
            {onGoogleLogin && (
              <button
                onClick={onGoogleLogin}
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>أو تسجيل الدخول بـ Google</span>
              </button>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              className={`w-full py-4.5 py-[18px] rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                isSubmitting
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-95'
                  : !name.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري التحضير...</span>
                </>
              ) : (
                <>
                  <span>يلّا نبدأ!</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <p className="text-indigo-200/60 text-xs">
            قسّمها v2.0 • صُنع بـ 💜
          </p>
        </div>
      </div>
    </div>
  );
}
