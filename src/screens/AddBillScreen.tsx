import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { categoryConfig } from '@/utils/helpers';
import { validateAmount, validateTitle } from '@/utils/validation';
import { ArrowRight, AlertCircle, Equal, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import type { BillCategory } from '@/types';

// ─── نوع التقسيم
type SplitMode = 'equal' | 'custom';

export function AddBillScreen() {
  const { navigate, addBillCustom, selectedGroupId, groups, getUserById } = useApp();
  const { symbol } = useCurrency();

  const [title, setTitle]             = useState('');
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState<BillCategory>('food');
  const [paidBy, setPaidBy]           = useState('user-1');
  const [splitMode, setSplitMode]     = useState<SplitMode>('equal');

  // Custom split amounts per user
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Validation
  const [titleError,  setTitleError ] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [submitted,   setSubmitted  ] = useState(false);

  // Advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  const group = groups.find((g) => g.id === selectedGroupId);
  if (!group) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const memberCount  = group.members.length;

  // ── حساب التقسيم المتساوي
  const equalShare = memberCount > 0 ? Math.round((parsedAmount / memberCount) * 10) / 10 : 0;

  // ── حساب مجموع المبالغ المخصصة
  const customTotal = useMemo(() => {
    return group.members.reduce((sum, m) => {
      return sum + (parseFloat(customAmounts[m.userId] || '0') || 0);
    }, 0);
  }, [customAmounts, group.members]);

  const remaining   = Math.round((parsedAmount - customTotal) * 100) / 100;
  const isOverflow  = remaining < -0.001;
  const isExact     = Math.abs(remaining) < 0.001;

  // ── Validation handlers
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (submitted) {
      const r = validateTitle(v);
      setTitleError(r.valid ? null : (r.error ?? null));
    }
  };

  const handleAmountChange = (v: string) => {
    setAmount(v);
    if (submitted) {
      const r = validateAmount(v);
      setAmountError(r.valid ? null : (r.error ?? null));
    }
  };

  // ── تحديث مبلغ مخصص لشخص
  const handleCustomAmount = (userId: string, val: string) => {
    setCustomAmounts((prev) => ({ ...prev, [userId]: val }));
  };

  // ── توزيع المتبقي تلقائياً على الكل
  const autoDistribute = () => {
    if (parsedAmount <= 0) return;
    const share = Math.round((parsedAmount / memberCount) * 100) / 100;
    const newAmounts: Record<string, string> = {};
    group.members.forEach((m, i) => {
      // الشخص الأخير يأخذ الباقي لتجنب التقريب
      if (i === memberCount - 1) {
        const others = group.members
          .slice(0, -1)
          .reduce((s) => s + share, 0);
        newAmounts[m.userId] = String(
          Math.round((parsedAmount - others) * 100) / 100
        );
      } else {
        newAmounts[m.userId] = String(share);
      }
    });
    setCustomAmounts(newAmounts);
  };

  // ── تصفير التوزيع المخصص
  const resetCustom = () => {
    setCustomAmounts({});
  };

  // ── Submit
  const handleSubmit = () => {
    setSubmitted(true);
    const titleCheck  = validateTitle(title);
    const amountCheck = validateAmount(amount);

    setTitleError(titleCheck.valid   ? null : (titleCheck.error  ?? null));
    setAmountError(amountCheck.valid ? null : (amountCheck.error ?? null));

    if (!titleCheck.valid || !amountCheck.valid) return;
    if (parsedAmount <= 0) {
      setAmountError('⛔ المبلغ يجب أن يكون أكبر من صفر');
      return;
    }

    if (splitMode === 'custom' && !isExact) {
      return; // يمنع التقديم لو المجموع غير متطابق
    }

    // بناء خريطة التقسيم
    const splits: Record<string, number> = {};
    if (splitMode === 'equal') {
      group.members.forEach((m) => { splits[m.userId] = equalShare; });
    } else {
      group.members.forEach((m) => {
        splits[m.userId] = parseFloat(customAmounts[m.userId] || '0') || 0;
      });
    }

    addBillCustom(
      group.id, title.trim(), parsedAmount, category,
      splitMode, paidBy, splits, description.trim() || undefined
    );

    navigate('group-detail');
  };

  const categories = Object.entries(categoryConfig) as [BillCategory, typeof categoryConfig[BillCategory]][];

  return (
    <div className="pb-10 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]">

      {/* ── Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-5 pt-14 pb-5 border-b border-gray-100 dark:border-[#2d2d4a] shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('group-detail')}
            className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">فاتورة جديدة</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 mt-6 space-y-5">

        {/* ── Amount card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 text-center relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-indigo-200 text-sm font-medium mb-2">المبلغ الإجمالي</p>
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
                className={`bg-transparent text-white text-5xl font-black text-center w-52 placeholder:text-white/30 focus:outline-none ${amountError ? 'border-b-2 border-red-400' : ''}`}
                dir="ltr"
              />
              <span className="text-indigo-200 text-xl font-bold">{symbol}</span>
            </div>

            {amountError && (
              <div className="mt-3 flex items-center justify-center gap-2 bg-red-500/20 backdrop-blur-sm rounded-2xl px-4 py-2 animate-slide-up">
                <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                <span className="text-red-200 text-sm font-bold">{amountError}</span>
              </div>
            )}

            {/* Split mode preview */}
            {parsedAmount > 0 && !amountError && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2">
                <span className="text-white/80 text-sm">
                  {splitMode === 'equal' ? 'للشخص:' : 'تقسيم مخصص'}
                </span>
                {splitMode === 'equal' && (
                  <span className="text-white font-black text-base">
                    {equalShare.toFixed(1)} {symbol}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Split Mode Toggle */}
        <div className="bg-white dark:bg-[#1e1e32] rounded-3xl shadow-sm border border-gray-100 dark:border-[#2d2d4a] p-2 flex gap-2">
          <button
            onClick={() => setSplitMode('equal')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${
              splitMode === 'equal'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <Equal className="w-4 h-4" />
            تقسيم متساوٍ
          </button>
          <button
            onClick={() => setSplitMode('custom')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${
              splitMode === 'custom'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            تقسيم مخصص
          </button>
        </div>

        {/* ── Equal Split Preview */}
        {splitMode === 'equal' && parsedAmount > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl p-4 border border-indigo-100 dark:border-indigo-500/20 animate-slide-up">
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
              <Equal className="w-3.5 h-3.5" />
              التقسيم المتساوي ({memberCount} أشخاص)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {group.members.map((m) => {
                const user = getUserById(m.userId);
                if (!user) return null;
                return (
                  <div
                    key={m.userId}
                    className="bg-white dark:bg-[#1e1e32] rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
                  >
                    <span className="text-xl">{user.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 dark:text-gray-100 truncate">
                        {m.userId === 'user-1' ? 'أنا' : user.name.split(' ')[0]}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-black">
                        {equalShare.toFixed(1)} {symbol}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Custom Split */}
        {splitMode === 'custom' && (
          <div className="bg-white dark:bg-[#1e1e32] rounded-3xl shadow-sm border border-gray-100 dark:border-[#2d2d4a] overflow-hidden animate-slide-up">

            {/* Header + actions */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2d2d4a]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-500" />
                  <span className="font-black text-gray-900 dark:text-gray-100 text-sm">التقسيم المخصص</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={autoDistribute}
                    className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors"
                  >
                    توزيع تلقائي
                  </button>
                  <button
                    onClick={resetCustom}
                    className="text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                  >
                    مسح
                  </button>
                </div>
              </div>

              {/* Progress bar - المبلغ المتبقي */}
              {parsedAmount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 dark:text-gray-400">
                      موزَّع: <span className="text-gray-900 dark:text-gray-100">{customTotal.toFixed(1)} {symbol}</span>
                    </span>
                    <span className={`font-black ${
                      isExact    ? 'text-emerald-600 dark:text-emerald-400'
                      : isOverflow ? 'text-red-500'
                      : 'text-orange-500'
                    }`}>
                      {isExact
                        ? '✅ مكتمل'
                        : isOverflow
                        ? `⛔ زيادة ${Math.abs(remaining).toFixed(1)}`
                        : `⏳ متبقي ${remaining.toFixed(1)} ${symbol}`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[#2a2a3e] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        isExact    ? 'bg-emerald-500'
                        : isOverflow ? 'bg-red-500'
                        : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, parsedAmount > 0 ? (customTotal / parsedAmount) * 100 : 0)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom amount per person */}
            <div className="divide-y divide-gray-50 dark:divide-[#2d2d4a]">
              {group.members.map((m) => {
                const user = getUserById(m.userId);
                if (!user) return null;
                const val = customAmounts[m.userId] || '';
                const numVal = parseFloat(val) || 0;
                const pct = parsedAmount > 0 ? Math.round((numVal / parsedAmount) * 100) : 0;

                return (
                  <div key={m.userId} className="px-5 py-3.5 flex items-center gap-3.5">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                      numVal > 0 ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-gray-100 dark:bg-[#2a2a3e]'
                    }`}>
                      {user.avatar}
                    </div>

                    {/* Name + percent */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
                        {m.userId === 'user-1' ? 'أنا' : user.name}
                        {m.userId === paidBy && (
                          <span className="text-xs text-indigo-500 mr-1 font-medium">(الدافع)</span>
                        )}
                      </p>
                      {numVal > 0 && parsedAmount > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 bg-gray-100 dark:bg-[#2a2a3e] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                pct > 100 ? 'bg-red-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black ${
                            pct > 100 ? 'text-red-500' : 'text-purple-600 dark:text-purple-400'
                          }`}>
                            {pct}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => handleCustomAmount(m.userId, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.5"
                        className="w-24 bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#3d3d5a] rounded-2xl px-3 py-2 text-left text-sm font-black text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/15 transition-all"
                        dir="ltr"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{symbol}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remaining alert */}
            {parsedAmount > 0 && !isExact && (
              <div className={`mx-4 mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl animate-slide-up ${
                isOverflow
                  ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                  : 'bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30'
              }`}>
                <AlertCircle className={`w-4 h-4 flex-shrink-0 ${isOverflow ? 'text-red-500' : 'text-orange-500'}`} />
                <p className={`text-xs font-bold ${isOverflow ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {isOverflow
                    ? `⛔ المجموع يتجاوز الإجمالي بمقدار ${Math.abs(remaining).toFixed(1)} ${symbol}`
                    : `⏳ المبلغ المتبقي غير موزَّع: ${remaining.toFixed(1)} ${symbol}`
                  }
                </p>
              </div>
            )}

            {/* Success message */}
            {parsedAmount > 0 && isExact && (
              <div className="mx-4 mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl animate-bounce-in">
                <span className="text-emerald-600 dark:text-emerald-400 text-base">✅</span>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  تم توزيع المبلغ بالكامل بنجاح!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Title */}
        <div>
          <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-2">
            عنوان الفاتورة *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="مثال: عشاء المطعم"
            className={`w-full bg-white dark:bg-[#1e1e32] border-2 rounded-2xl px-4 py-4 text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-4 transition-all font-medium ${
              titleError
                ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-500/10 animate-shake'
                : 'border-gray-200 dark:border-[#2d2d4a] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-500/10'
            }`}
            dir="rtl"
          />
          {titleError && (
            <div className="flex items-center gap-2 mt-2 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">{titleError}</span>
            </div>
          )}
        </div>

        {/* ── Advanced Options (Description + Category + PaidBy) */}
        <div className="bg-white dark:bg-[#1e1e32] rounded-3xl shadow-sm border border-gray-100 dark:border-[#2d2d4a] overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="text-sm font-black text-gray-700 dark:text-gray-300">خيارات إضافية</span>
            {showAdvanced
              ? <ChevronUp className="w-5 h-5 text-gray-400" />
              : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {showAdvanced && (
            <div className="px-5 pb-5 space-y-5 border-t border-gray-100 dark:border-[#2d2d4a] pt-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-2">
                  وصف <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تفاصيل إضافية..."
                  className="w-full bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#2d2d4a] rounded-2xl px-4 py-4 text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium"
                  dir="rtl"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-3">التصنيف</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        category === key
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-105 shadow-md shadow-indigo-500/15'
                          : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#1e1e32] hover:border-gray-200 dark:hover:border-[#3d3d5a]'
                      }`}
                    >
                      <span className="text-2xl">{config.emoji}</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-bold">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid By */}
              <div>
                <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-3">من دفع؟</label>
                <div className="space-y-2">
                  {group.members.map((member) => {
                    const user = getUserById(member.userId);
                    if (!user) return null;
                    return (
                      <button
                        key={member.userId}
                        onClick={() => setPaidBy(member.userId)}
                        className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all ${
                          paidBy === member.userId
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                            : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#1e1e32] hover:border-gray-200 dark:hover:border-[#3d3d5a]'
                        }`}
                      >
                        <div className="w-11 h-11 bg-gray-100 dark:bg-[#2a2a3e] rounded-2xl flex items-center justify-center text-xl">
                          {user.avatar}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {member.userId === 'user-1' ? 'أنا دفعت' : user.name}
                        </span>
                        {paidBy === member.userId && (
                          <div className="mr-auto w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            !title.trim() ||
            !amount ||
            parsedAmount <= 0 ||
            (splitMode === 'custom' && !isExact)
          }
          className={`w-full py-[18px] rounded-2xl font-black text-base transition-all shadow-xl hover:-translate-y-0.5 ${
            !title.trim() || !amount || parsedAmount <= 0 || (splitMode === 'custom' && !isExact)
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
              : splitMode === 'custom'
              ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-purple-500/30 hover:shadow-purple-500/40'
              : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/30 hover:shadow-indigo-500/40'
          }`}
        >
          {!title.trim() || !amount || parsedAmount <= 0
            ? 'أدخل العنوان والمبلغ'
            : splitMode === 'custom' && !isExact
            ? `وزّع المبلغ المتبقي (${remaining.toFixed(1)} ${symbol})`
            : splitMode === 'custom'
            ? `إضافة الفاتورة بالتقسيم المخصص 🎯`
            : `إضافة الفاتورة 📄`
          }
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
