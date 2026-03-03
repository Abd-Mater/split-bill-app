import { useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneDisplay } from '@/services/authService';
import {
  ArrowRight,
  Shield,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

export function OTPScreen() {
  const {
    state,
    setOtp,
    handleVerifyOTP,
    handleResendOTP,
    handleGoBack,
    decrementTimer,
  } = useAuth();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown
  useEffect(() => {
    if (state.resendTimer > 0) {
      timerRef.current = setInterval(() => {
        decrementTimer();
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.resendTimer > 0, decrementTimer]);

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (state.otpCode.length === 6 && !state.isVerifying) {
      const timer = setTimeout(() => handleVerifyOTP(), 300);
      return () => clearTimeout(timer);
    }
  }, [state.otpCode, state.isVerifying, handleVerifyOTP]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '').slice(-1);

      // Build new OTP
      const currentDigits = state.otpCode.split('');
      while (currentDigits.length < 6) currentDigits.push('');
      currentDigits[index] = digit;
      const newOtp = currentDigits.join('').replace(/\s/g, '');
      setOtp(newOtp);

      // Move to next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [state.otpCode, setOtp]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        const currentDigits = state.otpCode.split('');
        if (!currentDigits[index] && index > 0) {
          // Move back
          inputRefs.current[index - 1]?.focus();
          currentDigits[index - 1] = '';
          setOtp(currentDigits.join(''));
        } else {
          currentDigits[index] = '';
          setOtp(currentDigits.join(''));
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        if (index < 5) inputRefs.current[index + 1]?.focus();
      } else if (e.key === 'ArrowRight') {
        if (index > 0) inputRefs.current[index - 1]?.focus();
      }
    },
    [state.otpCode, setOtp]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        setOtp(pasted);
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
      }
    },
    [setOtp]
  );

  const formattedPhone = formatPhoneDisplay(state.phoneNumber);
  const otpDigits = state.otpCode.padEnd(6, ' ').split('');

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 animate-gradient relative overflow-hidden" dir="rtl">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-8 pb-8 min-h-screen flex flex-col">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center self-start mb-6 hover:bg-white/25 transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>

        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-lg rounded-3xl mb-5 shadow-xl shadow-indigo-900/20 relative">
            <Shield className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1">
              <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">رمز التحقق</h1>
          <p className="text-indigo-200 text-sm leading-6">
            أرسلنا رمز تحقق مكون من 6 أرقام إلى
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-white font-bold text-lg tracking-wider" dir="ltr">
              {formattedPhone}
            </span>
            <button
              onClick={handleGoBack}
              className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>
        </div>

        {/* OTP Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-900/30 p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {/* OTP Inputs */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-4 text-center">
              أدخل رمز التحقق
            </label>
            <div className="flex gap-2.5 justify-center" dir="ltr" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit === ' ' ? '' : digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={(e) => e.target.select()}
                  className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 transition-all duration-200 otp-input ${
                    state.otpError
                      ? 'border-red-400 bg-red-50 text-red-600 animate-shake'
                      : digit !== ' '
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100'
                  }`}
                  disabled={state.isVerifying}
                />
              ))}
            </div>
          </div>

          {/* OTP Error */}
          {state.otpError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 mb-4 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">رمز غير صحيح</p>
                <p className="text-xs text-red-600 mt-0.5">{state.otpError}</p>
              </div>
            </div>
          )}

          {/* General Error */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 mb-4 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerifyOTP}
            disabled={state.isVerifying || state.otpCode.length < 6}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-200 mb-4 ${
              state.isVerifying || state.otpCode.length < 6
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}
          >
            {state.isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin-slow" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>تأكيد</span>
              </>
            )}
          </button>

          {/* Resend Section */}
          <div className="text-center pt-3 border-t border-gray-100">
            {!state.canResend ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">لم تستلم الرمز؟</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-sm" dir="ltr">
                      {formatTimer(state.resendTimer)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">يمكنك إعادة الإرسال بعد</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={state.isSendingAgain}
                className="flex items-center justify-center gap-2 mx-auto text-indigo-600 hover:text-indigo-700 transition-colors py-2 px-4 rounded-xl hover:bg-indigo-50"
              >
                {state.isSendingAgain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin-slow" />
                    <span className="text-sm font-medium">جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm font-bold">إعادة إرسال الرمز</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
            <span className="text-yellow-300 text-sm">💡</span>
            <span className="text-white/80 text-xs">
              رمز التحقق التجريبي: <span className="font-black text-white text-sm tracking-widest">123456</span>
            </span>
          </div>
        </div>

        {/* Security info */}
        <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-white/50">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs">تشفير E2E</span>
              </div>
              <div className="w-1 h-1 bg-white/30 rounded-full" />
              <div className="flex items-center gap-1.5 text-white/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs">Firebase Auth</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 text-center">
          <p className="text-indigo-200/60 text-xs">
            قسّمها v1.0 • صُنع بـ 💜
          </p>
        </div>
      </div>
    </div>
  );
}
