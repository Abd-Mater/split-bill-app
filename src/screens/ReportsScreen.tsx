import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users, Receipt, ChevronLeft, ChevronRight, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';

interface ReportsScreenProps {
  onBack: () => void;
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const CATEGORY_INFO: Record<string, { icon: string; label: string; color: string }> = {
  food: { icon: '🍕', label: 'طعام', color: '#f97316' },
  transport: { icon: '🚗', label: 'مواصلات', color: '#3b82f6' },
  housing: { icon: '🏠', label: 'إيجار', color: '#8b5cf6' },
  entertainment: { icon: '🎮', label: 'ترفيه', color: '#ec4899' },
  shopping: { icon: '🛍️', label: 'تسوق', color: '#14b8a6' },
  travel: { icon: '✈️', label: 'سفر', color: '#f59e0b' },
  utilities: { icon: '⚡', label: 'خدمات', color: '#6366f1' },
  other: { icon: '📦', label: 'أخرى', color: '#64748b' },
};

export default function ReportsScreen({ onBack }: ReportsScreenProps) {
  const { bills, groups, currentUser } = useApp();
  const { symbol } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'groups'>('overview');
  const isDark = document.documentElement.classList.contains('dark');

  const monthBills = useMemo(() => {
    return bills.filter(bill => {
      const d = new Date(bill.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [bills, selectedMonth, selectedYear]);

  const prevMonthBills = useMemo(() => {
    const pm = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const py = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    return bills.filter(bill => {
      const d = new Date(bill.createdAt);
      return d.getMonth() === pm && d.getFullYear() === py;
    });
  }, [bills, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const totalSpent = monthBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const prevTotal = prevMonthBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const changePercent = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

    const myPaid = monthBills
      .filter(b => b.paidBy === currentUser.id || b.paidBy === currentUser.name)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const myShare = monthBills.reduce((sum, b) => {
      const split = b.splits?.find(s => s.userId === currentUser.id || s.userId === currentUser.name);
      return sum + (split?.amount || 0);
    }, 0);

    const paidBills = monthBills.filter(b => b.splits?.every(s => s.paid)).length;
    const pendingBills = monthBills.length - paidBills;

    const avgBill = monthBills.length > 0 ? totalSpent / monthBills.length : 0;

    const categoryTotals: Record<string, number> = {};
    monthBills.forEach(b => {
      const cat = b.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + b.totalAmount;
    });

    const groupTotals: Record<string, { name: string; total: number; count: number; icon: string }> = {};
    monthBills.forEach(b => {
      const group = groups.find(g => g.id === b.groupId);
      if (group) {
        if (!groupTotals[group.id]) {
          groupTotals[group.id] = { name: group.name, total: 0, count: 0, icon: group.emoji };
        }
        groupTotals[group.id].total += b.totalAmount;
        groupTotals[group.id].count += 1;
      }
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const topGroup = Object.entries(groupTotals).sort((a, b) => b[1].total - a[1].total)[0];

    return {
      totalSpent,
      prevTotal,
      changePercent,
      myPaid,
      myShare,
      billCount: monthBills.length,
      paidBills,
      pendingBills,
      avgBill,
      categoryTotals,
      groupTotals,
      topCategory,
      topGroup,
    };
  }, [monthBills, prevMonthBills, groups, currentUser]);

  const goNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const goPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const maxCategoryValue = Math.max(...Object.values(stats.categoryTotals), 1);
  const maxGroupValue = Math.max(...Object.values(stats.groupTotals).map(g => g.total), 1);

  const formatNum = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0f0f1a] text-white' : 'bg-[#f0f4ff] text-gray-900'}`}>

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white pt-12 pb-6 px-5 rounded-b-[32px]">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">📊 التقارير الشهرية</h1>
          <div className="w-10" />
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={goPrevMonth} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
            <ChevronRight size={20} />
          </button>
          <div className="text-center min-w-[140px]">
            <div className="text-2xl font-bold">{MONTHS_AR[selectedMonth]}</div>
            <div className="text-white/70 text-sm">{selectedYear}</div>
          </div>
          <button onClick={goNextMonth} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-center">
          <div className="text-white/70 text-sm mb-1">إجمالي الإنفاق</div>
          <div className="text-4xl font-bold mb-2">{formatNum(stats.totalSpent)} <span className="text-lg">{symbol}</span></div>
          {stats.prevTotal > 0 && (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              stats.changePercent > 0 ? 'bg-red-500/30 text-red-200' : 'bg-green-500/30 text-green-200'
            }`}>
              {stats.changePercent > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(formatNum(stats.changePercent))}% عن الشهر السابق
            </div>
          )}
          {stats.prevTotal === 0 && stats.totalSpent > 0 && (
            <div className="text-white/50 text-sm">لا توجد بيانات للشهر السابق للمقارنة</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-5 mb-4">
        <div className={`flex rounded-2xl p-1.5 ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
          {[
            { id: 'overview' as const, label: 'نظرة عامة', icon: <BarChart3 size={16} /> },
            { id: 'categories' as const, label: 'التصنيفات', icon: <PieChart size={16} /> },
            { id: 'groups' as const, label: 'المجموعات', icon: <Users size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ===== TAB: Overview ===== */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'عدد الفواتير', value: stats.billCount, icon: <Receipt size={20} className="text-indigo-500" />, suffix: 'فاتورة', color: 'indigo' },
                { label: 'متوسط الفاتورة', value: formatNum(stats.avgBill), icon: <DollarSign size={20} className="text-amber-500" />, suffix: symbol, color: 'amber' },
                { label: 'دفعتَ أنت', value: formatNum(stats.myPaid), icon: <TrendingUp size={20} className="text-green-500" />, suffix: symbol, color: 'green' },
                { label: 'حصتك', value: formatNum(stats.myShare), icon: <TrendingDown size={20} className="text-red-500" />, suffix: symbol, color: 'red' },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-[#2a2a3e]' : `bg-${stat.color}-50`
                    }`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stat.label} {typeof stat.value === 'number' && stat.suffix !== 'فاتورة' ? stat.suffix : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Status */}
            <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
              <h3 className="font-bold text-lg mb-4">📋 حالة الفواتير</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-green-500">{stats.paidBills}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>مكتملة ✅</div>
                </div>
                <div className={`w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-amber-500">{stats.pendingBills}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>معلقة ⏳</div>
                </div>
              </div>
              {stats.billCount > 0 && (
                <div className="relative">
                  <div className={`w-full h-4 rounded-full ${isDark ? 'bg-[#2a2a3e]' : 'bg-gray-100'}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                      style={{ width: `${(stats.paidBills / stats.billCount) * 100}%` }}
                    />
                  </div>
                  <div className={`text-center text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {Math.round((stats.paidBills / stats.billCount) * 100)}% مكتملة
                  </div>
                </div>
              )}
            </div>

            {/* Net Balance */}
            <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
              <h3 className="font-bold text-lg mb-3">💰 صافي حسابك</h3>
              {(() => {
                const net = stats.myPaid - stats.myShare;
                return (
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {net >= 0 ? '+' : ''}{formatNum(net)} {symbol}
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                      net > 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : net < 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {net > 0 ? '💰 لك أموال عند الآخرين' : net < 0 ? '📤 عليك مبالغ للآخرين' : '✅ حسابك متعادل'}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Highlights */}
            {(stats.topCategory || stats.topGroup) && (
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                <h3 className="font-bold text-lg mb-4">⭐ أبرز الإحصائيات</h3>
                <div className="space-y-3">
                  {stats.topCategory && (
                    <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#2a2a3e]' : 'bg-indigo-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{CATEGORY_INFO[stats.topCategory[0]]?.icon || '📦'}</span>
                        <div>
                          <div className="font-medium text-sm">أكثر تصنيف إنفاقاً</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {CATEGORY_INFO[stats.topCategory[0]]?.label || 'أخرى'}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-indigo-600">{formatNum(stats.topCategory[1])} {symbol}</div>
                    </div>
                  )}
                  {stats.topGroup && (
                    <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#2a2a3e]' : 'bg-purple-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{stats.topGroup[1].icon}</span>
                        <div>
                          <div className="font-medium text-sm">أكثر مجموعة إنفاقاً</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {stats.topGroup[1].name}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-purple-600">{formatNum(stats.topGroup[1].total)} {symbol}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== TAB: Categories ===== */}
        {activeTab === 'categories' && (
          <>
            {Object.keys(stats.categoryTotals).length === 0 ? (
              <div className={`p-10 rounded-2xl text-center ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                <div className="text-5xl mb-4">📊</div>
                <div className="font-bold text-lg mb-2">لا توجد فواتير</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  لا توجد فواتير في {MONTHS_AR[selectedMonth]} {selectedYear}
                </div>
              </div>
            ) : (
              <>
                {/* Donut Chart Simulation */}
                <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                  <h3 className="font-bold text-lg mb-4">🎨 توزيع الإنفاق بالتصنيف</h3>
                  <div className="flex items-center justify-center mb-5">
                    <div className="relative w-44 h-44">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {(() => {
                          const total = Object.values(stats.categoryTotals).reduce((s, v) => s + v, 0);
                          let offset = 0;
                          const entries = Object.entries(stats.categoryTotals).sort((a, b) => b[1] - a[1]);
                          return entries.map(([cat, val]) => {
                            const pct = (val / total) * 100;
                            const circumference = Math.PI * 36;
                            const dashLength = (pct / 100) * circumference;
                            const dashGap = circumference - dashLength;
                            const dashOffset = -(offset / 100) * circumference;
                            offset += pct;
                            const color = CATEGORY_INFO[cat]?.color || '#64748b';
                            return (
                              <circle
                                key={cat}
                                cx="50" cy="50" r="18"
                                fill="none"
                                stroke={color}
                                strokeWidth="12"
                                strokeDasharray={`${dashLength} ${dashGap}`}
                                strokeDashoffset={dashOffset}
                                className="transition-all duration-1000"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold">{Object.keys(stats.categoryTotals).length}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تصنيفات</div>
                      </div>
                    </div>
                  </div>

                  {/* Category Legend */}
                  <div className="space-y-2">
                    {Object.entries(stats.categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                      const total = Object.values(stats.categoryTotals).reduce((s, v) => s + v, 0);
                      const pct = total > 0 ? (val / total) * 100 : 0;
                      const info = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
                      return (
                        <div key={cat} className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-[#2a2a3e]' : 'bg-gray-50'}`}>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
                          <span className="text-lg">{info.icon}</span>
                          <span className="flex-1 font-medium text-sm">{info.label}</span>
                          <span className="font-bold text-sm">{formatNum(val)} {symbol}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-[#1e1e32]' : 'bg-white'}`}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bar Chart */}
                <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                  <h3 className="font-bold text-lg mb-4">📊 مقارنة التصنيفات</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                      const info = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
                      const widthPct = (val / maxCategoryValue) * 100;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium flex items-center gap-1">
                              {info.icon} {info.label}
                            </span>
                            <span className="text-sm font-bold">{formatNum(val)} {symbol}</span>
                          </div>
                          <div className={`w-full h-6 rounded-lg overflow-hidden ${isDark ? 'bg-[#2a2a3e]' : 'bg-gray-100'}`}>
                            <div
                              className="h-full rounded-lg transition-all duration-1000 ease-out"
                              style={{ width: `${widthPct}%`, backgroundColor: info.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== TAB: Groups ===== */}
        {activeTab === 'groups' && (
          <>
            {Object.keys(stats.groupTotals).length === 0 ? (
              <div className={`p-10 rounded-2xl text-center ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                <div className="text-5xl mb-4">👥</div>
                <div className="font-bold text-lg mb-2">لا توجد مجموعات</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  لا توجد فواتير لأي مجموعة في {MONTHS_AR[selectedMonth]} {selectedYear}
                </div>
              </div>
            ) : (
              <>
                {/* Group Cards */}
                <div className="space-y-3">
                  {Object.entries(stats.groupTotals)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([gId, gData], index) => {
                      const widthPct = (gData.total / maxGroupValue) * 100;
                      return (
                        <div key={gId} className={`p-4 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                              isDark ? 'bg-[#2a2a3e]' : 'bg-indigo-50'
                            }`}>
                              {gData.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold">{gData.name}</div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {gData.count} فاتورة
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-lg text-indigo-600">{formatNum(gData.total)}</div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{symbol}</div>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a3e]' : 'bg-gray-100'}`}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          {/* Rank Badge */}
                          {index === 0 && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">
                              👑 الأكثر إنفاقاً
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Group Comparison */}
                <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
                  <h3 className="font-bold text-lg mb-4">📊 مقارنة المجموعات</h3>
                  <div className="space-y-4">
                    {Object.entries(stats.groupTotals)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([gId, gData]) => {
                        const total = Object.values(stats.groupTotals).reduce((s, g) => s + g.total, 0);
                        const pct = total > 0 ? (gData.total / total) * 100 : 0;
                        return (
                          <div key={gId} className="flex items-center gap-3">
                            <span className="text-xl">{gData.icon}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{gData.name}</span>
                                <span className="font-bold">{Math.round(pct)}%</span>
                              </div>
                              <div className={`w-full h-2 rounded-full ${isDark ? 'bg-[#2a2a3e]' : 'bg-gray-100'}`}>
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-1000"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* No Data State */}
        {monthBills.length === 0 && (
          <div className={`p-10 rounded-2xl text-center ${isDark ? 'bg-[#1e1e32]' : 'bg-white'} shadow-sm`}>
            <div className="text-6xl mb-4">📭</div>
            <div className="font-bold text-xl mb-2">لا توجد بيانات</div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              لا توجد فواتير في شهر {MONTHS_AR[selectedMonth]} {selectedYear}
            </div>
            <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              جرّب التنقل بين الأشهر باستخدام الأسهم ↔️
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
