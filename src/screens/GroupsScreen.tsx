import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/helpers';
import { ArrowRight, Plus, Users, Receipt, TrendingUp } from 'lucide-react';

export function GroupsScreen() {
  const { groups, bills, navigate, selectGroup, getUserById } = useApp();

  const totalSpentAll = bills.reduce((s, b) => s + b.totalAmount, 0);
  const pendingAll = bills.filter(b => b.splits.some(s => !s.paid)).length;

  return (
    <div className="pb-28 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-5 pt-14 pb-5 border-b border-gray-100 dark:border-[#2d2d4a] shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate('home')}
            className="icon-btn w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">المجموعات</h1>
          <button
            onClick={() => navigate('create-group')}
            className="btn-premium w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'المجموعات', value: groups.length, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { label: 'الإجمالي', value: `${(totalSpentAll/1000).toFixed(1)}K`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'معلقة', value: pendingAll, icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
              <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {groups.map((group, idx) => {
          const groupBills = bills.filter((b) => b.groupId === group.id);
          const totalAmount = groupBills.reduce((acc, b) => acc + b.totalAmount, 0);
          const unpaidBills = groupBills.filter((b) => b.splits.some((s) => !s.paid)).length;
          const memberNames = group.members
            .slice(0, 3)
            .map((m) => getUserById(m.userId)?.name.split(' ')[0])
            .join('، ');
          const paidBillsCount = groupBills.filter(b => b.splits.every(s => s.paid)).length;
          const progressPct = groupBills.length > 0 ? Math.round((paidBillsCount / groupBills.length) * 100) : 0;

          return (
            <button
              key={group.id}
              onClick={() => selectGroup(group.id)}
              className="card-hover w-full bg-white dark:bg-[#1e1e32] rounded-3xl p-5 shadow-sm dark:shadow-black/20 border border-gray-100 dark:border-[#2d2d4a] text-right animate-slide-up overflow-hidden"
              style={{ animationDelay: `${idx * 0.06}s` }}
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/40 via-purple-500/60 to-indigo-500/40" />

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                  {group.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-base truncate">{group.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {memberNames}{group.members.length > 3 ? ` +${group.members.length - 3}` : ''}
                    </p>
                  </div>
                  {/* Progress */}
                  {groupBills.length > 0 && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="flex-1 bg-gray-100 dark:bg-[#2a2a3e] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 font-bold">{progressPct}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl px-2.5 py-1">
                      <Receipt className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{groupBills.length} فاتورة</span>
                    </div>
                    {unpaidBills > 0 && (
                      <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-500/15 rounded-xl px-2.5 py-1">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{unpaidBills} معلقة</span>
                      </div>
                    )}
                    {unpaidBills === 0 && groupBills.length > 0 && (
                      <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl px-2.5 py-1">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✅ مكتملة</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="font-black text-gray-900 dark:text-gray-100 text-base">{formatCurrency(totalAmount)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">الإجمالي</p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Add group card */}
        <button
          onClick={() => navigate('create-group')}
          className="w-full bg-gray-50 dark:bg-[#1e1e32] rounded-3xl p-6 border-2 border-dashed border-gray-200 dark:border-[#2d2d4a] flex flex-col items-center justify-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 active:scale-98 transition-all animate-slide-up"
          style={{ animationDelay: `${groups.length * 0.06}s` }}
        >
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-3 hover:scale-110 transition-transform">
            <Plus className="w-7 h-7 text-indigo-400" />
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-bold">إنشاء مجموعة جديدة</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs mt-1">أضف أصدقاءك وابدأ التقسيم</span>
        </button>
      </div>
    </div>
  );
}
