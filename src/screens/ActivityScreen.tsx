import { useApp } from '@/context/AppContext';
import { formatCurrency, categoryConfig, formatDate } from '@/utils/helpers';
import { ArrowRight, Search, X, Filter, SlidersHorizontal } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { BillCategory } from '@/types';

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type StatusFilter = 'all' | 'pending' | 'done';

export function ActivityScreen() {
  const { bills, groups, navigate, getUserById, selectGroup } = useApp();

  // ── حالة البحث والفلترة
  const [searchQuery, setSearchQuery]   = useState('');
  const [showFilters, setShowFilters]   = useState(false);
  const [sortBy, setSortBy]             = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<BillCategory | 'all'>('all');

  // ── معالجة البحث والفلترة
  const filteredBills = useMemo(() => {
    let result = [...bills];

    // 🔍 البحث بالنص
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((bill) => {
        const payer = getUserById(bill.paidBy);
        const group = groups.find((g) => g.id === bill.groupId);
        return (
          bill.title.toLowerCase().includes(q) ||
          bill.description?.toLowerCase().includes(q) ||
          payer?.name.toLowerCase().includes(q) ||
          group?.name.toLowerCase().includes(q) ||
          bill.totalAmount.toString().includes(q)
        );
      });
    }

    // 📂 فلتر التصنيف
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }

    // ✅ فلتر الحالة
    if (statusFilter === 'pending') {
      result = result.filter((b) => b.splits.some((s) => !s.paid));
    } else if (statusFilter === 'done') {
      result = result.filter((b) => b.splits.every((s) => s.paid));
    }

    // 🔃 الترتيب
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'highest') return b.totalAmount - a.totalAmount;
      if (sortBy === 'lowest')  return a.totalAmount - b.totalAmount;
      return 0;
    });

    return result;
  }, [bills, searchQuery, categoryFilter, statusFilter, sortBy, getUserById, groups]);

  const totalSpent   = bills.reduce((s, b) => s + b.totalAmount, 0);
  const pendingBills = bills.filter((b) => b.splits.some((s) => !s.paid)).length;
  const hasFilters   = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="pb-28 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">
      {/* ── Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-5 pt-14 pb-4 border-b border-gray-100 dark:border-[#2d2d4a] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('home')}
            className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">سجل النشاط</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative ${
              showFilters || hasFilters
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1a2e]" />
            )}
          </button>
        </div>

        {/* ── شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن فاتورة، شخص، مجموعة..."
            className="w-full bg-gray-100 dark:bg-[#1e1e32] rounded-2xl pr-10 pl-10 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30 border border-transparent dark:border-[#2d2d4a] transition-all"
            dir="rtl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* ── لوحة الفلاتر */}
        {showFilters && (
          <div className="mt-4 space-y-4 animate-slide-up">
            {/* ترتيب */}
            <div>
              <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> ترتيب حسب
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'newest',  label: '🕐 الأحدث أولاً' },
                  { value: 'oldest',  label: '📅 الأقدم أولاً' },
                  { value: 'highest', label: '💰 الأعلى مبلغاً' },
                  { value: 'lowest',  label: '🪙 الأقل مبلغاً' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as SortOption)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all text-right ${
                      sortBy === opt.value
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a4e]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* حالة الفاتورة */}
            <div>
              <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2">الحالة</p>
              <div className="flex gap-2">
                {[
                  { value: 'all',     label: 'الكل',       color: 'bg-gray-500' },
                  { value: 'pending', label: '⏳ معلقة',   color: 'bg-orange-500' },
                  { value: 'done',    label: '✅ مكتملة',  color: 'bg-emerald-500' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value as StatusFilter)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      statusFilter === opt.value
                        ? `${opt.color} text-white shadow-md`
                        : 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* تصنيف الفاتورة */}
            <div>
              <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2">التصنيف</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  🗂 الكل
                </button>
                {(Object.entries(categoryConfig) as [BillCategory, typeof categoryConfig[BillCategory]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(key)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                      categoryFilter === key
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* زر مسح الفلاتر */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
                مسح جميع الفلاتر
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Summary pills */}
      <div className="px-5 mt-5 flex gap-3">
        <div className="flex-1 bg-white dark:bg-[#1e1e32] rounded-2xl p-4 border border-gray-100 dark:border-[#2d2d4a] shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">إجمالي الفواتير</p>
          <p className="text-xl font-black text-gray-900 dark:text-gray-100">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="flex-1 bg-white dark:bg-[#1e1e32] rounded-2xl p-4 border border-gray-100 dark:border-[#2d2d4a] shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">فواتير معلقة</p>
          <p className="text-xl font-black text-orange-500">{pendingBills}</p>
        </div>
      </div>

      {/* ── نتائج البحث */}
      <div className="px-5 mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">
          {searchQuery || hasFilters
            ? `${filteredBills.length} نتيجة`
            : `${filteredBills.length} فاتورة`}
        </p>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-500 font-black flex items-center gap-1 hover:text-indigo-600 transition-colors"
          >
            <X className="w-3 h-3" />
            مسح الفلاتر
          </button>
        )}
      </div>

      <div className="px-5 mt-3 space-y-2.5">
        {filteredBills.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-700 dark:text-gray-300 font-black text-lg">لا توجد نتائج</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
              {searchQuery ? `لم يتم العثور على "${searchQuery}"` : 'جرّب تغيير الفلاتر'}
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-colors"
            >
              مسح الفلاتر
            </button>
          </div>
        )}
        {filteredBills.map((bill) => {
          const payer = getUserById(bill.paidBy);
          const group = groups.find((g) => g.id === bill.groupId);
          const config = categoryConfig[bill.category];
          const myShare = bill.splits.find((s) => s.userId === 'user-1');
          const isPayer = bill.paidBy === 'user-1';
          const paidCount = bill.splits.filter((s) => s.paid).length;
          const done = paidCount === bill.splits.length;

          return (
            <button
              key={bill.id}
              onClick={() => selectGroup(bill.groupId)}
              className="w-full bg-white dark:bg-[#1e1e32] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-[#2d2d4a] text-right hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-13 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${config.color}`}>
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{bill.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {isPayer ? '💳 أنت دفعت' : `${payer?.name?.split(' ')[0]} دفع`}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{group?.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(bill.createdAt)}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="font-black text-gray-900 dark:text-gray-100">{formatCurrency(bill.totalAmount)}</p>
                  {myShare && (
                    <span className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${
                      done
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : isPayer
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                            : myShare.paid
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                    {done
                        ? '✅ مكتملة'
                        : isPayer
                        ? `+${formatCurrency(bill.totalAmount - (myShare?.amount || 0))}`
                        : myShare.paid
                        ? '✅ مدفوع'
                        : `-${formatCurrency(myShare.amount)}`}
                  </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

