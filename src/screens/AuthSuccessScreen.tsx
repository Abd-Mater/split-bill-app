import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle2,
  LogOut,
  Users,
  Receipt,
  TrendingUp,
  Shield,
  Smartphone,
  Clock,
} from 'lucide-react';

export function AuthSuccessScreen() {
  const { state, handleSignOut } = useAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!state.user) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-5 pt-12 pb-10 rounded-b-[2.5rem] relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />

        {/* Success animation */}
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/15 backdrop-blur-lg rounded-full mb-5 relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-pulse-ring" />
            <div className="absolute inset-2 bg-green-400/10 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
            <div className="relative w-16 h-16 bg-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-white mb-2 animate-slide-up">
            تم تسجيل الدخول بنجاح! 🎉
          </h1>
          <p className="text-indigo-200 text-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
            مرحباً بك في تطبيق قسّمها
          </p>
        </div>
      </div>

      {showContent && (
        <div className="px-5 -mt-5">
          {/* User Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 mb-4 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">مستخدم جديد</h3>
                <p className="text-sm text-gray-500 mt-0.5" dir="ltr">
                  {state.user.phoneNumber}
                </p>
              </div>
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-700 text-xs font-bold">مُفعّل ✓</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              تفاصيل الحساب
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm">رقم الهاتف</span>
                </div>
                <span className="text-sm font-bold text-gray-900" dir="ltr">
                  {state.user.phoneNumber}
                </span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">معرّف المستخدم</span>
                </div>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-600" dir="ltr">
                  {state.user.uid.slice(0, 12)}...
                </span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">تاريخ التسجيل</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(state.user.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* App Features */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-bold text-gray-900 mb-4">ما يمكنك فعله الآن</h3>
            <div className="space-y-3">
              {[
                {
                  icon: Users,
                  color: 'bg-blue-100 text-blue-600',
                  title: 'إنشاء مجموعات',
                  desc: 'أنشئ مجموعة وأضف أصدقائك',
                },
                {
                  icon: Receipt,
                  color: 'bg-purple-100 text-purple-600',
                  title: 'تقسيم الفواتير',
                  desc: 'أضف فاتورة وقسّمها بالتساوي',
                },
                {
                  icon: TrendingUp,
                  color: 'bg-orange-100 text-orange-600',
                  title: 'تتبع المدفوعات',
                  desc: 'اعرف من دفع ومن لم يدفع بعد',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className={`w-10 h-10 ${feature.color} rounded-xl flex items-center justify-center`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{feature.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Firebase Info Card */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🔥</span>
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 text-sm">Firebase Authentication</h4>
                <p className="text-xs text-indigo-700/70 mt-1 leading-5">
                  تم التحقق من هويتك عبر Firebase Phone Auth. في التطبيق الحقيقي، سيتم ربط حسابك بقاعدة بيانات Firestore لحفظ بياناتك.
                </p>
              </div>
            </div>
          </div>

          {/* Flutter Code Structure Info */}
          <div className="bg-gray-900 rounded-2xl p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-400 text-xs mr-2 font-mono">Flutter Equivalent</span>
            </div>
            <pre className="text-xs text-gray-300 font-mono leading-6 overflow-x-auto" dir="ltr">
{`// auth_provider.dart
class AuthProvider extends ChangeNotifier {
  FirebaseAuth _auth = FirebaseAuth.instance;
  User? _user;
  
  Future<void> verifyPhone(String phone) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phone,
      verificationCompleted: (credential) {
        _auth.signInWithCredential(credential);
      },
      codeSent: (verificationId, _) {
        _verificationId = verificationId;
        notifyListeners();
      },
    );
  }
}`}
            </pre>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-white border-2 border-red-200 text-red-600 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 hover:bg-red-50 hover:border-red-300 transition-all mb-8 animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
