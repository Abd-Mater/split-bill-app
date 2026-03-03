import { useApp } from '@/context/AppContext';
import { ArrowRight, Plus, UserMinus, Phone, Search } from 'lucide-react';
import { useState } from 'react';

export function FriendsScreen() {
  const { navigate, friends, getUserById, removeFriend } = useApp();
  const [search, setSearch] = useState('');

  const filteredFriends = friends.filter((id) => {
    const user = getUserById(id);
    return user?.name.includes(search) || user?.phone?.includes(search);
  });

  return (
    <div className="pb-28 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-5 pt-14 pb-4 border-b border-gray-100 dark:border-[#2d2d4a] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('home')}
            className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">الأصدقاء</h1>
          <button
            onClick={() => navigate('add-friend')}
            className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن صديق..."
            className="w-full bg-gray-100 dark:bg-[#1e1e32] rounded-2xl pr-10 pl-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30 border border-transparent dark:border-[#2d2d4a]"
            dir="rtl"
          />
        </div>
      </div>

      <div className="px-5 mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-4">
          {filteredFriends.length} {search ? 'نتيجة' : 'صديق'}
        </p>
        <div className="space-y-2.5">
          {filteredFriends.map((friendId) => {
            const user = getUserById(friendId);
            if (!user) return null;
            return (
              <div
                key={friendId}
                className="bg-white dark:bg-[#1e1e32] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-[#2d2d4a] flex items-center gap-3.5"
              >
                <div className="w-13 w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl">
                  {user.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-900 dark:text-gray-100">{user.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium" dir="ltr">{user.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friendId)}
                  className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <UserMinus className="w-4.5 w-[18px] h-[18px] text-red-500" />
                </button>
              </div>
            );
          })}

          {filteredFriends.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 font-bold">لا توجد نتائج</p>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('add-friend')}
          className="w-full mt-5 bg-gray-50 dark:bg-[#1e1e32] rounded-3xl p-5 border-2 border-dashed border-gray-200 dark:border-[#2d2d4a] flex flex-col items-center hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
        >
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-2">
            <Plus className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">إضافة صديق جديد</span>
        </button>
      </div>
    </div>
  );
}
