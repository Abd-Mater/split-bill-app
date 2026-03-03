import { useState, useEffect } from 'react';
import { Edit3, Check, X, Moon, Sun, Trash2, LogOut, ChevronRight, Shield, Bell, HelpCircle, Star, Database } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { groups, bills, friends, currentUser } = useApp();

  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qassimha_user_name') || currentUser.name || 'مستخدم';
    setUserName(saved);
    setEditedName(saved);
  }, [currentUser.name]);

  const totalSpent = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const myBills = bills.filter(b => b.paidBy === currentUser.id);
  const mySpent = myBills.reduce((sum, b) => sum + b.totalAmount, 0);

  const storageItems = [
    { key: 'qassimha_groups', label: 'المجموعات', icon: '👥', count: groups.length },
    { key: 'qassimha_bills', label: 'الفواتير', icon: '🧾', count: bills.length },
    { key: 'qassimha_friends', label: 'الأصدقاء', icon: '👫', count: friends.length },
  ];

  const storageSize = (() => {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('qassimha_')) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return (total / 1024).toFixed(1);
  })();

  // ── حفظ الاسم ──
  const handleSaveName = () => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      setNameError('الاسم لا يمكن أن يكون فارغاً');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('الاسم يجب أن يكون حرفين على الأقل');
      return;
    }
    if (trimmed.length > 30) {
      setNameError('الاسم لا يتجاوز 30 حرفاً');
      return;
    }
    localStorage.setItem('qassimha_user_name', trimmed);
    setUserName(trimmed);
    setNameError('');
    setIsEditingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 3000);
    window.dispatchEvent(new Event('storage'));
  };

  const handleCancelEdit = () => {
    setEditedName(userName);
    setNameError('');
    setIsEditingName(false);
  };

  const handleClearData = () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('qassimha_') && k !== 'qassimha_user_name' && k !== 'qassimha_theme') {
        localStorage.removeItem(k);
      }
    });
    setShowClearConfirm(false);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('qassimha_user_name');
    window.location.reload();
  };

  const card = isDark ? 'bg-[#1e1e32] border border-[#2d2d4a]' : 'bg-white border border-gray-100';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-500';
  const bg = isDark ? 'bg-[#0f0f1a]' : 'bg-[#f0f4ff]';
  const input = isDark ? 'bg-[#2a2a3e] border-[#3d3d5a] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900';

  return (
    <div className={`min-h-screen ${bg} pb-24`} dir="rtl">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 pt-14 pb-20 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: `${60 + i * 30}px`, height: `${60 + i * 30}px`, top: `${i * 15}%`, right: `${i * 10 - 20}%`, opacity: 0.3 }} />
          ))}
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">الملف الشخصي</h1>
          <button onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-all">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* ── بطاقة الاسم ── */}
      <div className="px-5 -mt-14 relative z-10 mb-5">
        <div className={`${card} rounded-3xl p-5 shadow-xl`}>

          {/* رسالة النجاح */}
          {nameSaved && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-2 animate-bounce-in">
              <Check size={16} className="text-green-500 shrink-0" />
              <span className="text-green-700 text-sm font-medium">تم حفظ الاسم بنجاح ✅</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white text-3xl font-bold">
                {userName.charAt(0) || '؟'}
              </span>
            </div>

            {/* الاسم */}
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => { setEditedName(e.target.value); setNameError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelEdit(); }}
                    className={`w-full border rounded-xl px-3 py-2 text-base font-bold outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${input} ${nameError ? 'border-red-400' : ''}`}
                    placeholder="أدخل اسمك"
                    autoFocus
                    maxLength={30}
                  />
                  {nameError && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <X size={12} /> {nameError}
                    </p>
                  )}
                  <p className={`text-xs ${sub}`}>{editedName.length}/30 حرف</p>
                  <div className="flex gap-2">
                    <button onClick={handleSaveName}
                      className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1 hover:bg-indigo-700 active:scale-95 transition-all">
                      <Check size={14} /> حفظ
                    </button>
                    <button onClick={handleCancelEdit}
                      className={`flex-1 ${isDark ? 'bg-[#2a2a3e] text-gray-300' : 'bg-gray-100 text-gray-600'} rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1 hover:opacity-80 active:scale-95 transition-all`}>
                      <X size={14} /> إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-xl font-bold ${text} truncate`}>{userName}</h2>
                    <button onClick={() => { setIsEditingName(true); setEditedName(userName); }}
                      className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 hover:bg-indigo-200 active:scale-90 transition-all shrink-0">
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <p className={`text-sm ${sub} mt-0.5`}>اضغط ✏️ لتعديل اسمك</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">نشط الآن</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ── إحصائيات ── */}
        <div className={`${card} rounded-3xl p-5 shadow-sm`}>
          <h3 className={`font-bold ${text} mb-4 flex items-center gap-2`}>
            <Star size={18} className="text-yellow-500" /> ملخصك المالي
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'المجموعات', value: groups.length, icon: '👥', color: 'from-indigo-500 to-indigo-600' },
              { label: 'الفواتير', value: bills.length, icon: '🧾', color: 'from-purple-500 to-purple-600' },
              { label: 'الأصدقاء', value: friends.length, icon: '👫', color: 'from-pink-500 to-pink-600' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-3 text-center text-white shadow-md`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs opacity-80">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className={`${isDark ? 'bg-[#2a2a3e]' : 'bg-indigo-50'} rounded-2xl p-3`}>
              <p className={`text-xs ${sub}`}>إجمالي الإنفاق</p>
              <p className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {totalSpent.toLocaleString()} <span className="text-xs">ر.س</span>
              </p>
            </div>
            <div className={`${isDark ? 'bg-[#2a2a3e]' : 'bg-purple-50'} rounded-2xl p-3`}>
              <p className={`text-xs ${sub}`}>ما دفعته أنت</p>
              <p className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {mySpent.toLocaleString()} <span className="text-xs">ر.س</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── الإعدادات ── */}
        <div className={`${card} rounded-3xl overflow-hidden shadow-sm`}>
          <div className={`px-5 py-3 border-b ${isDark ? 'border-[#2d2d4a]' : 'border-gray-100'}`}>
            <h3 className={`font-bold ${text} flex items-center gap-2`}>
              <Shield size={16} className="text-indigo-500" /> الإعدادات
            </h3>
          </div>

          {/* الوضع الليلي */}
          <button onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-[#2d2d4a] hover:bg-[#2a2a3e]' : 'border-gray-50 hover:bg-gray-50'} transition-all`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-500" />}
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${text}`}>{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</p>
                <p className={`text-xs ${sub}`}>الوضع الحالي: {isDark ? '🌙 ليلي' : '☀️ نهاري'}</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-all relative ${isDark ? 'bg-indigo-600' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${isDark ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </button>

          {/* الإشعارات */}
          <button className={`w-full flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-[#2d2d4a] hover:bg-[#2a2a3e]' : 'border-gray-50 hover:bg-gray-50'} transition-all`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <Bell size={18} className="text-blue-500" />
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${text}`}>الإشعارات</p>
                <p className={`text-xs ${sub}`}>تذكير بالمدفوعات المعلقة</p>
              </div>
            </div>
            <ChevronRight size={16} className={sub} />
          </button>

          {/* المساعدة */}
          <button className={`w-full flex items-center justify-between px-5 py-4 ${isDark ? 'hover:bg-[#2a2a3e]' : 'hover:bg-gray-50'} transition-all`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <HelpCircle size={18} className="text-green-500" />
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${text}`}>المساعدة والدعم</p>
                <p className={`text-xs ${sub}`}>كيفية استخدام التطبيق</p>
              </div>
            </div>
            <ChevronRight size={16} className={sub} />
          </button>
        </div>

        {/* ── البيانات المحفوظة ── */}
        <div className={`${card} rounded-3xl p-5 shadow-sm`}>
          <h3 className={`font-bold ${text} mb-4 flex items-center gap-2`}>
            <Database size={16} className="text-indigo-500" /> البيانات المحفوظة
          </h3>
          <div className="space-y-3">
            {storageItems.map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-[#2a2a3e]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className={`text-sm font-medium ${text}`}>{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.count}</span>
              </div>
            ))}
          </div>
          <div className={`mt-3 p-3 rounded-2xl ${isDark ? 'bg-[#2a2a3e]' : 'bg-gray-50'} flex items-center justify-between`}>
            <span className={`text-sm ${sub}`}>حجم البيانات المحفوظة</span>
            <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{storageSize} KB</span>
          </div>

          {/* زر مسح البيانات */}
          <button onClick={() => setShowClearConfirm(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-95 transition-all text-sm font-medium">
            <Trash2 size={16} /> مسح جميع البيانات
          </button>
        </div>

        {/* ── زر تسجيل الخروج ── */}
        <button onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-3xl py-4 font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all">
          <LogOut size={20} /> تسجيل الخروج
        </button>

        <p className={`text-center text-xs ${sub} pb-2`}>قسّمها v1.0.0 • صُنع بـ ❤️</p>
      </div>

      {/* ── نافذة تأكيد مسح البيانات ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
          onClick={() => setShowClearConfirm(false)}>
          <div className={`${isDark ? 'bg-[#1e1e32]' : 'bg-white'} rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in`}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={36} className="text-red-500" />
              </div>
              <h3 className={`text-xl font-bold ${text} mb-2`}>مسح جميع البيانات؟</h3>
              <p className={`text-sm ${sub}`}>سيتم حذف كل المجموعات والفواتير والأصدقاء نهائياً. لا يمكن التراجع!</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-sm ${isDark ? 'bg-[#2a2a3e] text-gray-300' : 'bg-gray-100 text-gray-700'} hover:opacity-80 active:scale-95 transition-all`}>
                إلغاء
              </button>
              <button onClick={handleClearData}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all shadow-lg">
                🗑️ مسح نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── نافذة تأكيد تسجيل الخروج ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
          onClick={() => setShowLogoutConfirm(false)}>
          <div className={`${isDark ? 'bg-[#1e1e32]' : 'bg-white'} rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in`}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={36} className="text-orange-500" />
              </div>
              <h3 className={`text-xl font-bold ${text} mb-2`}>تسجيل الخروج؟</h3>
              <p className={`text-sm ${sub}`}>سيتم مسح اسمك وستحتاج لإدخاله مرة أخرى عند الدخول. بياناتك ستبقى محفوظة.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-sm ${isDark ? 'bg-[#2a2a3e] text-gray-300' : 'bg-gray-100 text-gray-700'} hover:opacity-80 active:scale-95 transition-all`}>
                إلغاء
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all shadow-lg">
                🚪 تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
