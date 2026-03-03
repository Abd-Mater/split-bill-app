import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { groupEmojis } from '@/utils/helpers';
import { ArrowRight, Check, Users } from 'lucide-react';

export function CreateGroupScreen() {
  const { navigate, createGroup, friends, getUserById } = useApp();
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍔');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!name.trim() || selectedMembers.length === 0) return;
    createGroup(name.trim(), selectedEmoji, selectedMembers);
  };

  return (
    <div className="pb-10 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-5 pt-14 pb-5 border-b border-gray-100 dark:border-[#2d2d4a] shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('home')}
            className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">مجموعة جديدة</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Preview */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl">
            {selectedEmoji}
          </div>
          <div>
            <p className="text-indigo-200 text-xs mb-0.5">اسم المجموعة</p>
            <h2 className="text-white text-xl font-black">{name || 'مجموعتي الجديدة'}</h2>
            <p className="text-indigo-200 text-xs mt-1">
              {selectedMembers.length + 1} أعضاء (أنت + {selectedMembers.length})
            </p>
          </div>
        </div>

        {/* Emoji Picker */}
        <div>
          <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-3">رمز المجموعة</label>
          <div className="flex flex-wrap gap-2">
            {groupEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                  selectedEmoji === emoji
                    ? 'bg-indigo-500 ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-[#0f0f1a] scale-110 shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-100 dark:bg-[#1e1e32] hover:bg-gray-200 dark:hover:bg-[#2a2a3e]'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Group Name */}
        <div>
          <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-2">اسم المجموعة</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: رحلة الصيف"
            className="w-full bg-white dark:bg-[#1e1e32] border-2 border-gray-200 dark:border-[#2d2d4a] rounded-2xl px-4 py-4 text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all text-base font-medium"
            dir="rtl"
          />
        </div>

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              الأعضاء
            </label>
            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full">
              {selectedMembers.length} محدد
            </span>
          </div>
          <div className="space-y-2.5">
            {friends.map((friendId) => {
              const user = getUserById(friendId);
              if (!user) return null;
              const isSelected = selectedMembers.includes(friendId);
              return (
                <button
                  key={friendId}
                  onClick={() => toggleMember(friendId)}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                      : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#1e1e32] hover:border-gray-200 dark:hover:border-[#3d3d5a]'
                  }`}
                >
                  <div className="w-11 h-11 bg-gray-100 dark:bg-[#2a2a3e] rounded-2xl flex items-center justify-center text-xl">
                    {user.avatar}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.phone}</p>
                  </div>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-gray-200 dark:bg-[#2a2a3e]'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || selectedMembers.length === 0}
          className="w-full bg-indigo-500 text-white py-4.5 py-[18px] rounded-2xl font-black text-base hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
        >
          {selectedMembers.length === 0 ? 'اختر عضو على الأقل' : `إنشاء "${name || 'المجموعة'}" ✨`}
        </button>
      </div>
    </div>
  );
}
