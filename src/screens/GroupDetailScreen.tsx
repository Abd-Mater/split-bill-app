import { useApp } from '@/context/AppContext';
import { formatCurrency, categoryConfig, formatDate, groupEmojis } from '@/utils/helpers';
import { ArrowRight, Plus, Users, TrendingUp, Receipt, Layers, Calculator, Trash2, Edit2, Save, X, Check } from 'lucide-react';
import { useState } from 'react';

export function GroupDetailScreen() {
  const { groups, selectedGroupId, navigate, selectBill, getUserById, getGroupBills, getGroupBalance, updateGroup, deleteGroup } = useApp();
  const [tab, setTab] = useState<'bills' | 'balances' | 'members'>('bills');

  // ── Edit State
  const [isEditing, setIsEditing]         = useState(false);
  const [editName, setEditName]           = useState('');
  const [editEmoji, setEditEmoji]         = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const group = groups.find((g) => g.id === selectedGroupId);
  if (!group) return null;

  const groupBills = getGroupBills(group.id);
  const balances   = getGroupBalance(group.id);
  const totalSpent = groupBills.reduce((s, b) => s + b.totalAmount, 0);

  const tabs = [
    { key: 'bills',    label: 'الفواتير', icon: Receipt    },
    { key: 'balances', label: 'الأرصدة',  icon: TrendingUp },
    { key: 'members',  label: 'الأعضاء',  icon: Users      },
  ] as const;

  const handleStartEdit = () => {
    setEditName(group.name);
    setEditEmoji(group.emoji);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    updateGroup(group.id, { name: editName.trim(), emoji: editEmoji });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteGroup(group.id);
    navigate('groups');
  };

  // ── شاشة تأكيد الحذف
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1e1e32] rounded-3xl p-7 w-full max-w-sm shadow-2xl animate-scale-in text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl">
            🗑️
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">حذف المجموعة؟</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            هل أنت متأكد من حذف مجموعة <span className="font-black text-gray-800 dark:text-gray-200">"{group.name}"</span>؟
          </p>
          <p className="text-red-500 text-xs font-bold mb-6">
            ⚠️ سيتم حذف المجموعة وجميع فواتيرها ({groupBills.length} فاتورة). لا يمكن التراجع!
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-3.5 rounded-2xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2d2d4a] hover:bg-gray-200 dark:hover:bg-[#3d3d5a] transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3.5 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors"
            >
              🗑️ حذف نهائي
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-5 pt-14 pb-6 rounded-b-[2.5rem] relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-3xl" />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 relative">
          <button
            onClick={() => navigate('groups')}
            className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white font-black text-base">تفاصيل المجموعة</h2>

          {/* ── أزرار التعديل والحذف */}
          {!isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleStartEdit}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all active:scale-90"
                title="تعديل المجموعة"
              >
                <Edit2 className="w-4.5 w-[18px] h-[18px] text-white" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 bg-red-500/30 hover:bg-red-500/50 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all active:scale-90"
                title="حذف المجموعة"
              >
                <Trash2 className="w-4.5 w-[18px] h-[18px] text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* ── Group info - Normal or Edit Mode */}
        {!isEditing ? (
          <div className="relative flex items-center gap-4 mb-6">
            <div className="w-[72px] h-[72px] bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl flex-shrink-0">
              {group.emoji}
            </div>
            <div className="flex-1">
              <h1 className="text-white text-2xl font-black">{group.name}</h1>
              <p className="text-indigo-200 text-sm mt-1">
                {group.members.length} أعضاء • {groupBills.length} فاتورة
              </p>
              <p className="text-white font-black text-lg mt-1">{formatCurrency(totalSpent)} إجمالي</p>
            </div>
          </div>
        ) : (
          /* ── Edit Mode ── */
          <div className="relative mb-6 animate-scale-in space-y-4">
            {/* Emoji picker */}
            <div>
              <p className="text-indigo-200 text-xs font-bold mb-2">اختر رمز المجموعة</p>
              <div className="flex flex-wrap gap-2">
                {groupEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEditEmoji(emoji)}
                    className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                      editEmoji === emoji
                        ? 'bg-white shadow-lg scale-110'
                        : 'bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            {/* Name input */}
            <div>
              <p className="text-indigo-200 text-xs font-bold mb-2">اسم المجموعة</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {editEmoji}
                </div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="اسم المجموعة"
                  className="flex-1 bg-white/20 backdrop-blur-md text-white placeholder-white/50 font-black text-lg py-3 px-4 rounded-2xl border-2 border-transparent focus:border-white/50 outline-none"
                  dir="rtl"
                  autoFocus
                />
              </div>
            </div>
            {/* Save button */}
            <button
              onClick={handleSaveEdit}
              disabled={!editName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-white text-indigo-700 font-black py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              حفظ التعديلات
            </button>
          </div>
        )}

        {/* ── Action Buttons Row - يظهر فقط في الوضع العادي */}
        {!isEditing && (
          <div className="relative grid grid-cols-3 gap-2.5">
            <button
              onClick={() => navigate('add-bill')}
              className="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-md rounded-2xl px-2 py-3.5 hover:bg-white/30 transition-all active:scale-95 border border-white/15"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xs font-black leading-4 text-center">فاتورة{'\n'}واحدة</span>
            </button>

            <button
              onClick={() => navigate('multi-bill')}
              className="flex flex-col items-center gap-2 bg-yellow-400/25 backdrop-blur-md rounded-2xl px-2 py-3.5 hover:bg-yellow-400/40 transition-all active:scale-95 border border-yellow-300/30"
            >
              <div className="w-9 h-9 bg-yellow-300/20 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-yellow-200" />
              </div>
              <span className="text-yellow-100 text-xs font-black leading-4 text-center">فواتير{'\n'}متعددة</span>
            </button>

            <button
              onClick={() => navigate('bill-calculator')}
              className="flex flex-col items-center gap-2 bg-emerald-400/25 backdrop-blur-md rounded-2xl px-2 py-3.5 hover:bg-emerald-400/40 transition-all active:scale-95 border border-emerald-300/30"
            >
              <div className="w-9 h-9 bg-emerald-300/20 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-200" />
              </div>
              <span className="text-emerald-100 text-xs font-black leading-4 text-center">حاسبة{'\n'}ذكية</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 mt-4">
        <div className="bg-white dark:bg-[#1e1e32] rounded-3xl shadow-lg shadow-black/5 dark:shadow-black/20 p-1.5 flex gap-1 border border-gray-100 dark:border-[#2d2d4a]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === t.key
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">

        {/* ── Bills Tab ── */}
        {tab === 'bills' && (
          <div className="space-y-2.5">
            {groupBills.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">📄</div>
                <p className="text-gray-700 dark:text-gray-300 font-black text-lg">لا توجد فواتير بعد</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1 mb-5">اختر طريقة لإضافة فاتورة</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('add-bill')}
                    className="bg-indigo-500 text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    فاتورة واحدة
                  </button>
                  <button
                    onClick={() => navigate('bill-calculator')}
                    className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    الحاسبة
                  </button>
                </div>
              </div>
            ) : (
              groupBills.map((bill) => {
                const payer = getUserById(bill.paidBy);
                const config = categoryConfig[bill.category];
                const paidCount = bill.splits.filter((s) => s.paid).length;
                const pct = Math.round((paidCount / bill.splits.length) * 100);
                const done = pct === 100;
                return (
                  <button
                    key={bill.id}
                    onClick={() => selectBill(bill.id)}
                    className="w-full bg-white dark:bg-[#1e1e32] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-[#2d2d4a] text-right hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${config.color}`}>
                        {config.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-gray-900 dark:text-gray-100">{bill.title}</h3>
                          <span className="font-black text-gray-900 dark:text-gray-100">{formatCurrency(bill.totalAmount)}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {payer?.name?.split(' ')[0]} • {formatDate(bill.createdAt)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-gray-100 dark:bg-[#2a2a3e] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            done
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                          }`}>
                            {paidCount}/{bill.splits.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ── Balances Tab ── */}
        {tab === 'balances' && (
          <div className="space-y-2.5">
            {balances.map(({ userId, balance }) => {
              const user = getUserById(userId);
              if (!user) return null;
              return (
                <div key={userId} className="bg-white dark:bg-[#1e1e32] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-[#2d2d4a] flex items-center gap-3.5">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-[#2a2a3e] rounded-2xl flex items-center justify-center text-2xl">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{userId === 'user-1' ? 'أنت' : 'عضو'}</p>
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-lg ${balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : balance < 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {balance > 0 ? '+' : ''}{formatCurrency(balance)}
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      balance > 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : balance < 0 ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    }`}>
                      {balance > 0 ? 'يستحق' : balance < 0 ? 'مدين' : 'متساوٍ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Members Tab ── */}
        {tab === 'members' && (
          <div className="space-y-2.5">
            {group.members.map((member) => {
              const user = getUserById(member.userId);
              if (!user) return null;
              return (
                <div key={member.userId} className="bg-white dark:bg-[#1e1e32] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-[#2d2d4a] flex items-center gap-3.5">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir="ltr">{user.phone}</p>
                  </div>
                  {member.role === 'admin' ? (
                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-full">مدير</span>
                  ) : (
                    <span className="bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs font-medium px-3 py-1 rounded-full">عضو</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
