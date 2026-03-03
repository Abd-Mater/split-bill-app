import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { CurrencySelector } from '@/components/CurrencySelector';
import { formatCurrency } from '@/utils/helpers';
import {
  ArrowDownLeft, ArrowUpRight, Plus, Users, Receipt,
  TrendingUp, Wallet, Bell, ChevronLeft, BarChart3
} from 'lucide-react';

export function HomeScreen() {
  const { currentUser, groups, bills, navigate, selectGroup, getTotalOwed, getTotalOwing, getUserById, users } = useApp();
  const { unreadCount } = useNotifications();
  void users;
  // ✅ دائماً نقرأ الاسم مباشرة من localStorage - أولوية قصوى - بدون أي fallback لأحمد محمد
  const displayName = localStorage.getItem('qassimha_user_name') || 'أنت';
  const { formatAmount } = useCurrency();
  const totalOwed = getTotalOwed();
  const totalOwing = getTotalOwing();
  const netBalance = totalOwed - totalOwing;
  const recentBills = bills.slice(0, 5);

  return (
    <div className="pb-28 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">

      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-5 pt-14 pb-10 rounded-b-[2.5rem] relative overflow-hidden shadow-2xl shadow-indigo-500/25">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-56 h-56 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-indigo-400/5 rounded-full blur-3xl" />

        {/* Top row */}
        <div className="relative flex items-center justify-between mb-7 stagger-1">
          <div>
            <p className="text-indigo-200 text-sm font-medium">مرحباً 👋</p>
            <h1 className="text-white text-2xl font-black mt-0.5">{displayName}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* ✅ منتقي العملة */}
            <CurrencySelector />
            <button
              onClick={() => navigate('notifications')}
              className="icon-btn w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-indigo-600 flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm border border-white/15">
              {currentUser.avatar}
            </div>
          </div>
        </div>

        {/* Currency info bar */}
        <div className="relative flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-indigo-200/70 text-xs font-medium">
            المبالغ بـ {formatAmount(0).replace('0.0', '').trim()}
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Balance card */}
        <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/15 stagger-2">
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-indigo-200" />
              <p className="text-indigo-200 text-xs font-medium">صافي الرصيد</p>
            </div>
            <p className={`text-4xl font-black mb-5 ${netBalance >= 0 ? 'text-white' : 'text-red-300'}`}>
              {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 hover:bg-white/15 rounded-2xl p-3.5 transition-all cursor-pointer">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-emerald-400/20 rounded-lg flex items-center justify-center">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                  <span className="text-indigo-200 text-xs font-medium">لك</span>
                </div>
                <p className="text-white font-black text-xl">{formatCurrency(totalOwed)}</p>
                <p className="text-emerald-300 text-xs mt-0.5 font-medium">يستحق</p>
              </div>
              <div className="bg-white/10 hover:bg-white/15 rounded-2xl p-3.5 transition-all cursor-pointer">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 bg-red-400/20 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-red-300" />
                  </div>
                  <span className="text-indigo-200 text-xs font-medium">عليك</span>
                </div>
                <p className="text-white font-black text-xl">{formatCurrency(totalOwing)}</p>
                <p className="text-red-300 text-xs mt-0.5 font-medium">مستحق</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-5 -mt-5 stagger-3">
        <div className="bg-white dark:bg-[#1e1e32] rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/25 p-4 grid grid-cols-5 gap-1 border border-gray-100/80 dark:border-[#2d2d4a]">
          {[
            { icon: Plus, label: 'مجموعة', color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400', shadow: 'shadow-indigo-200 dark:shadow-indigo-900', action: () => navigate('create-group') },
            { icon: Users, label: 'الأصدقاء', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400', shadow: 'shadow-purple-200 dark:shadow-purple-900', action: () => navigate('friends') },
            { icon: Receipt, label: 'فاتورة', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', shadow: 'shadow-emerald-200 dark:shadow-emerald-900', action: () => navigate('groups') },
            { icon: BarChart3, label: 'تقارير', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400', shadow: 'shadow-rose-200 dark:shadow-rose-900', action: () => navigate('reports') },
            { icon: TrendingUp, label: 'النشاط', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400', shadow: 'shadow-orange-200 dark:shadow-orange-900', action: () => navigate('activity') },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex flex-col items-center gap-2 py-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all"
            >
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-lg ${item.shadow} hover:scale-110 active:scale-95 transition-all`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Groups horizontal scroll ── */}
      <div className="mt-7 stagger-4">
        <div className="flex items-center justify-between mb-4 px-5">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">مجموعاتك</h2>
          <button
            onClick={() => navigate('groups')}
            className="flex items-center gap-1 text-indigo-500 text-sm font-bold hover:text-indigo-600 transition-colors"
          >
            عرض الكل
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-0 px-5 scrollbar-hide">
          {groups.map((group, idx) => {
            const groupBills = bills.filter((b) => b.groupId === group.id);
            const totalAmt = groupBills.reduce((s, b) => s + b.totalAmount, 0);
            const pendingCount = groupBills.filter(b => b.splits.some(s => !s.paid)).length;
            return (
              <button
                key={group.id}
                onClick={() => selectGroup(group.id)}
                className="card-hover flex-shrink-0 w-44 bg-white dark:bg-[#1e1e32] rounded-3xl p-4 shadow-sm dark:shadow-black/20 border border-gray-100 dark:border-[#2d2d4a] text-right relative overflow-hidden"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Subtle bg */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-3xl opacity-60" />
                <div className="text-3xl mb-3 w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                  {group.emoji}
                </div>
                <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm leading-5 truncate">{group.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{group.members.length} أعضاء</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-black text-indigo-500">{formatCurrency(totalAmt)}</p>
                  {pendingCount > 0 && (
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold">
                      {pendingCount} معلق
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => navigate('create-group')}
            className="flex-shrink-0 w-44 bg-gray-50 dark:bg-[#1e1e32] rounded-3xl p-4 border-2 border-dashed border-gray-200 dark:border-[#2d2d4a] flex flex-col items-center justify-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-2">
              <Plus className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold text-center">مجموعة جديدة</span>
          </button>
        </div>
      </div>

      {/* ── Recent Bills ── */}
      <div className="mt-6 px-5 stagger-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">آخر الفواتير</h2>
          <button
            onClick={() => navigate('activity')}
            className="flex items-center gap-1 text-indigo-500 text-sm font-bold hover:text-indigo-600 transition-colors"
          >
            عرض الكل
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2.5">
          {recentBills.map((bill, idx) => {
            const payer = getUserById(bill.paidBy);
            const group = groups.find((g) => g.id === bill.groupId);
            const paidCount = bill.splits.filter((s) => s.paid).length;
            const total = bill.splits.length;
            const pct = Math.round((paidCount / total) * 100);
            const done = paidCount === total;

            return (
              <button
                key={bill.id}
                onClick={() => selectGroup(bill.groupId)}
                className="card-hover w-full bg-white dark:bg-[#1e1e32] rounded-3xl p-4 shadow-sm dark:shadow-black/20 border border-gray-100 dark:border-[#2d2d4a] flex items-center gap-4 text-right"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                  {group?.emoji || '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm truncate">{bill.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    دفعها {payer?.name?.split(' ')[0] || '؟'} • {group?.name}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 dark:bg-[#2a2a3e] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${done ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{pct}%</span>
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="font-black text-gray-900 dark:text-gray-100 text-base">{formatCurrency(bill.totalAmount)}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${done ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'}`}>
                    {done ? '✅ منتهية' : `${paidCount}/${total}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
