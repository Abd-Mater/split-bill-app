import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowRight, UserPlus, Phone, User } from 'lucide-react';

export function AddFriendScreen() {
  const { navigate, addFriend } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return;
    addFriend(name.trim(), phone.trim());
  };

  return (
    <div className="pb-10 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-5 pt-14 pb-5 border-b border-gray-100 dark:border-[#2d2d4a] shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('friends')}
            className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">إضافة صديق</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 mt-8 space-y-6">
        {/* Icon */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/30">
            <UserPlus className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">أضف صديق جديد</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">أدخل بيانات صديقك لإضافته</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            الاسم
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم صديقك"
            className="w-full bg-white dark:bg-[#1e1e32] border-2 border-gray-200 dark:border-[#2d2d4a] rounded-2xl px-4 py-4 text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium text-base"
            dir="rtl"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-500" />
            رقم الهاتف
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+966 5X XXX XXXX"
            className="w-full bg-white dark:bg-[#1e1e32] border-2 border-gray-200 dark:border-[#2d2d4a] rounded-2xl px-4 py-4 text-left text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium text-base"
            dir="ltr"
          />
        </div>

        {/* Preview card */}
        {(name || phone) && (
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{name || '...'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">{phone || '...'}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !phone.trim()}
          className="w-full bg-indigo-500 text-white py-[18px] rounded-2xl font-black text-base hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
        >
          {!name.trim() || !phone.trim() ? 'أدخل الاسم ورقم الهاتف' : `إضافة ${name} 👋`}
        </button>
      </div>
    </div>
  );
}
