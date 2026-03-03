import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { countryCodes, type CountryCode } from '@/services/authService';
import {
  Phone,
  Shield,
  ChevronDown,
  X,
  AlertCircle,
  Search,
  Loader2,
  ArrowLeft,
  Sparkles,
  Receipt,
  Users,
  Zap,
} from 'lucide-react';

export function LoginScreen() {
  const { state, setPhone, setCountry, setTerms, handleSendOTP } = useAuth();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const phoneRef = useRef<HTMLInputElement>(null);

  // Focus phone input on mount
  useEffect(() => {
    const timer = setTimeout(() => phoneRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredCountries = countryCodes.filter(
    (c) =>
      c.nameAr.includes(countrySearch) ||
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch)
  );

  const handleCountrySelect = (country: CountryCode) => {
    setCountry(country);
    setShowCountryPicker(false);
    setCountrySearch('');
    phoneRef.current?.focus();
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
            <Zap className="w-4 h-4 text-white/60" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md mx-auto px-5 pt-16 pb-8 min-h-screen flex flex-col">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-lg rounded-3xl mb-5 shadow-xl shadow-indigo-900/20 relative">
            <span className="text-4xl">💰</span>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">قسّمها</h1>
          <p className="text-indigo-200 text-base font-medium">قسّم فواتيرك مع أصدقائك بسهولة</p>
        </div>

        {/* Feature badges */}
        <div className="flex justify-center gap-2 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {[
            { icon: '⚡', text: 'سريع' },
            { icon: '🔒', text: 'آمن' },
            { icon: '🆓', text: 'مجاني' },
          ].map((badge) => (
            <div
              key={badge.text}
              className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <span className="text-sm">{badge.icon}</span>
              <span className="text-white/90 text-xs font-medium">{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-900/30 p-6 flex-shrink-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-3">
              <Phone className="w-7 h-7 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">تسجيل الدخول</h2>
            <p className="text-gray-500 text-sm mt-1">أدخل رقم هاتفك للمتابعة</p>
          </div>

          {/* Phone Input Section */}
          <div className="space-y-4">
            {/* Label */}
            <label className="block text-sm font-bold text-gray-700">رقم الهاتف</label>

            {/* Phone Input with Country Code */}
            <div
              className={`flex items-center gap-0 border-2 rounded-2xl overflow-hidden transition-all duration-200 ${
                state.phoneError
                  ? 'border-red-400 bg-red-50/50 animate-shake'
                  : 'border-gray-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 bg-gray-50 focus-within:bg-white'
              }`}
            >
              {/* Country Code Button */}
              <button
                onClick={() => setShowCountryPicker(true)}
                className="flex items-center gap-1.5 px-3 py-4 bg-transparent hover:bg-gray-100/50 transition-colors flex-shrink-0 border-l border-gray-200"
                type="button"
              >
                <span className="text-xl">{state.selectedCountry.flag}</span>
                <span className="text-sm font-bold text-gray-700 tracking-wide" dir="ltr">
                  {state.selectedCountry.dialCode}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* Phone Number Input */}
              <input
                ref={phoneRef}
                type="tel"
                value={state.phoneNumber}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5XX XXX XXXX"
                className="flex-1 px-3 py-4 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-base font-medium phone-input"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            {/* Phone Error */}
            {state.phoneError && (
              <div className="flex items-center gap-2 text-red-500 animate-slide-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{state.phoneError}</span>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 mt-2">
              <button
                onClick={() => setTerms(!state.termsAccepted)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                  state.termsAccepted
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                {state.termsAccepted && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <p className="text-xs text-gray-500 leading-5">
                بالمتابعة أنت توافق على{' '}
                <span className="text-indigo-600 font-medium cursor-pointer hover:underline">
                  الشروط والأحكام
                </span>{' '}
                و{' '}
                <span className="text-indigo-600 font-medium cursor-pointer hover:underline">
                  سياسة الخصوصية
                </span>
              </p>
            </div>

            {/* General Error */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 animate-slide-up">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">خطأ</p>
                  <p className="text-xs text-red-600 mt-0.5">{state.error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSendOTP}
              disabled={state.isLoading || !state.phoneNumber.replace(/\D/g, '')}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-200 ${
                state.isLoading || !state.phoneNumber.replace(/\D/g, '')
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300'
              }`}
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin-slow" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <span>إرسال رمز التحقق</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-gray-100">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">
              محمي بتشفير Firebase Authentication
            </span>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
            <span className="text-yellow-300 text-sm">💡</span>
            <span className="text-white/80 text-xs">
              للتجربة: أدخل أي رقم سعودي • رمز التحقق: <span className="font-bold text-white">123456</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 text-center">
          <p className="text-indigo-200/60 text-xs">
            قسّمها v1.0 • صُنع بـ 💜
          </p>
        </div>
      </div>

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowCountryPicker(false);
              setCountrySearch('');
            }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-t-3xl w-full max-w-md max-h-[75vh] flex flex-col animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">اختر الدولة</h3>
              <button
                onClick={() => {
                  setShowCountryPicker(false);
                  setCountrySearch('');
                }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="ابحث عن دولة..."
                  className="w-full bg-gray-100 rounded-xl pr-10 pl-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Country List */}
            <div className="overflow-y-auto flex-1 px-2 pb-8">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                    state.selectedCountry.code === country.code
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1 text-right">
                    <p className="font-medium text-gray-900 text-sm">{country.nameAr}</p>
                    <p className="text-xs text-gray-500">{country.name}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-500" dir="ltr">
                    {country.dialCode}
                  </span>
                  {state.selectedCountry.code === country.code && (
                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
