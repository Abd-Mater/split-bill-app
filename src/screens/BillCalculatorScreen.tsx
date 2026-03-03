import { useState, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { categoryConfig } from '@/utils/helpers';
import { validateAmount } from '@/utils/validation';
import type { BillCategory } from '@/types';
import {
  ArrowRight, Plus, Trash2, ChevronDown, ChevronUp,
  Calculator, Check, Users, Percent, Receipt,
  TrendingUp, DollarSign, Sparkles, Info, AlertCircle,
  RotateCcw, ChevronRight, X
} from 'lucide-react';
import { buildWhatsAppMessage } from '@/utils/whatsapp';
import { ShareModal } from '@/components/ShareModal';

// ─── Types ───────────────────────────────────────────────────
interface BillItem {
  id: string;
  title: string;
  amount: string;
  category: BillCategory;
  paidBy: string;
  participants: string[];
  expanded: boolean;
}

interface PersonResult {
  userId: string;
  totalPaid: number;      // ما دفعه فعلاً
  totalOwed: number;      // ما عليه للآخرين
  netBalance: number;     // الفرق (+ = يستحق، - = مدين)
  billBreakdown: {
    billId: string;
    billTitle: string;
    baseShare: number;
    taxShare: number;
    tipShare: number;
    totalShare: number;
    isPayer: boolean;
  }[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
  settled: boolean;
}

// ─── Helper: round to 1 decimal ──────────────────────────────
const r1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (n: number) => r1(Math.abs(n)).toFixed(1);

// ─── Compute Logic ───────────────────────────────────────────
function computeResults(
  bills: BillItem[],
  taxRate: number,
  tipRate: number,
  memberIds: string[]
): PersonResult[] {
  const results: Record<string, PersonResult> = {};
  memberIds.forEach((id) => {
    results[id] = {
      userId: id,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
      billBreakdown: [],
    };
  });

  bills.forEach((bill) => {
    const baseAmt = parseFloat(bill.amount) || 0;
    if (baseAmt <= 0 || bill.participants.length === 0) return;

    const taxAmt = baseAmt * (taxRate / 100);
    const tipAmt = baseAmt * (tipRate / 100);
    const totalAmt = baseAmt + taxAmt + tipAmt;

    const n = bill.participants.length;
    const baseShare = r1(baseAmt / n);
    const taxShare  = r1(taxAmt / n);
    const tipShare  = r1(tipAmt / n);
    const totalShare = r1(totalAmt / n);

    // The payer paid the full amount
    if (results[bill.paidBy]) {
      results[bill.paidBy].totalPaid += totalAmt;
    }

    // Each participant owes their share
    bill.participants.forEach((pid) => {
      if (!results[pid]) return;
      results[pid].totalOwed += totalShare;
      results[pid].billBreakdown.push({
        billId: bill.id,
        billTitle: bill.title || 'فاتورة',
        baseShare,
        taxShare,
        tipShare,
        totalShare,
        isPayer: pid === bill.paidBy,
      });
    });
  });

  // Net balance = paid - owed
  memberIds.forEach((id) => {
    results[id].netBalance = r1(results[id].totalPaid - results[id].totalOwed);
  });

  return Object.values(results);
}

function computeSettlements(personResults: PersonResult[]): Settlement[] {
  const creditors = personResults
    .filter((p) => p.netBalance > 0.05)
    .map((p) => ({ userId: p.userId, net: p.netBalance }))
    .sort((a, b) => b.net - a.net);

  const debtors = personResults
    .filter((p) => p.netBalance < -0.05)
    .map((p) => ({ userId: p.userId, net: p.netBalance }))
    .sort((a, b) => a.net - b.net);

  const settlements: Settlement[] = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = r1(Math.min(creditors[ci].net, -debtors[di].net));
    settlements.push({
      from: debtors[di].userId,
      to: creditors[ci].userId,
      amount,
      settled: false,
    });
    creditors[ci].net = r1(creditors[ci].net - amount);
    debtors[di].net = r1(debtors[di].net + amount);
    if (creditors[ci].net < 0.05) ci++;
    if (-debtors[di].net < 0.05) di++;
  }

  return settlements;
}

// ─── Main Component ──────────────────────────────────────────
export function BillCalculatorScreen() {
  const { navigate, selectedGroupId, groups, getUserById } = useApp();
  void useCurrency(); // currency context available for future use

  const group = groups.find((g) => g.id === selectedGroupId);
  const members = group?.members ?? [];
  const memberIds = members.map((m) => m.userId);

  // ── bills state
  const [bills, setBills] = useState<BillItem[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      amount: '',
      category: 'food',
      paidBy: memberIds[0] ?? 'user-1',
      participants: [...memberIds],
      expanded: true,
    },
  ]);

  // ── tax & tip
  const [taxRate, setTaxRate] = useState<string>('15');
  const [tipRate, setTipRate] = useState<string>('0');
  const [customTip, setCustomTip] = useState<string>('');
  const [useCustomTip, setUseCustomTip] = useState(false);

  // ── UI
  const [showResults, setShowResults] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'settlements'>('summary');
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  // ── Validation errors (shown in toast/alert)
  const [calcError, setCalcError] = useState<string | null>(null);

  // ── computed
  const effectiveTip = useCustomTip ? parseFloat(customTip) || 0 : parseFloat(tipRate) || 0;
  const effectiveTax = parseFloat(taxRate) || 0;

  const validBills = useMemo(
    () => bills.filter((b) => b.title.trim() && parseFloat(b.amount) > 0 && b.participants.length > 0),
    [bills]
  );

  const totals = useMemo(() => {
    const base = validBills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
    const tax = r1(base * (effectiveTax / 100));
    const tip = r1(base * (effectiveTip / 100));
    return { base: r1(base), tax, tip, grand: r1(base + tax + tip) };
  }, [validBills, effectiveTax, effectiveTip]);

  const personResults = useMemo(
    () => computeResults(validBills, effectiveTax, effectiveTip, memberIds),
    [validBills, effectiveTax, effectiveTip, memberIds]
  );

  // ── handlers
  const updateBill = useCallback((id: string, patch: Partial<BillItem>) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const addBill = useCallback(() => {
    setBills((prev) => [
      ...prev.map((b) => ({ ...b, expanded: false })),
      {
        id: crypto.randomUUID(),
        title: '',
        amount: '',
        category: 'food',
        paidBy: memberIds[0] ?? 'user-1',
        participants: [...memberIds],
        expanded: true,
      },
    ]);
    setShowResults(false);
  }, [memberIds]);

  const removeBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    setShowResults(false);
  }, []);

  const toggleParticipant = useCallback((billId: string, userId: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== billId) return b;
        const has = b.participants.includes(userId);
        const next = has
          ? b.participants.filter((p) => p !== userId)
          : [...b.participants, userId];
        return { ...b, participants: next };
      })
    );
    setShowResults(false);
  }, []);

  const handleCalculate = useCallback(() => {
    // ── Validation قبل الحساب
    const taxCheck = validateAmount(taxRate) ;
    const tipCheck = validateAmount(useCustomTip ? customTip : tipRate);

    // تحقق من وجود مبالغ سالبة في الفواتير
    const negativeBill = validBills.find(b => parseFloat(b.amount) < 0);
    if (negativeBill) {
      setCalcError(`⛔ الفاتورة "${negativeBill.title}" تحتوي على مبلغ سالب`);
      return;
    }

    // تحقق من القسمة على صفر
    const zeroDivBill = validBills.find(b => b.participants.length === 0);
    if (zeroDivBill) {
      setCalcError(`⛔ الفاتورة "${zeroDivBill.title}" ليس لها مشمولون — لا يمكن القسمة على صفر`);
      return;
    }

    // تحقق من نسب الضريبة
    if (effectiveTax < 0) {
      setCalcError('⛔ نسبة الضريبة لا يمكن أن تكون سالبة');
      return;
    }
    if (effectiveTax > 100) {
      setCalcError('⚠️ نسبة الضريبة لا يمكن أن تتجاوز 100%');
      return;
    }
    if (effectiveTip < 0) {
      setCalcError('⛔ نسبة الخدمة لا يمكن أن تكون سالبة');
      return;
    }
    if (effectiveTip > 100) {
      setCalcError('⚠️ نسبة الخدمة لا يمكن أن تتجاوز 100%');
      return;
    }

    void taxCheck; void tipCheck;
    setCalcError(null);

    const s = computeSettlements(personResults);
    setSettlements(s);
    setShowResults(true);
    setActiveTab('summary');
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [personResults, validBills, effectiveTax, effectiveTip, taxRate, tipRate, customTip, useCustomTip]);

  const handleReset = useCallback(() => {
    setBills([{
      id: crypto.randomUUID(),
      title: '',
      amount: '',
      category: 'food',
      paidBy: memberIds[0] ?? 'user-1',
      participants: [...memberIds],
      expanded: true,
    }]);
    setShowResults(false);
    setTaxRate('15');
    setTipRate('0');
    setCustomTip('');
    setUseCustomTip(false);
  }, [memberIds]);

  const toggleSettlement = useCallback((idx: number) => {
    setSettlements((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, settled: !s.settled } : s))
    );
  }, []);

  if (!group) return null;

  const canCalculate = validBills.length > 0;
  const allSettled = settlements.length > 0 && settlements.every((s) => s.settled);

  const handleWhatsAppShare = () => {
    const message = buildWhatsAppMessage({
      groupName: group?.name || 'المجموعة',
      groupEmoji: group?.emoji || '📊',
      bills: validBills.map((bill) => {
        const baseAmt = parseFloat(bill.amount) || 0;
        const totalAmt = r1(baseAmt * (1 + effectiveTax / 100 + effectiveTip / 100));
        const payer = getUserById(bill.paidBy);
        return {
          title: bill.title,
          baseAmount: baseAmt,
          taxRate: effectiveTax,
          tipRate: effectiveTip,
          totalAmount: totalAmt,
          paidByName: payer?.name || 'غير محدد',
          participants: bill.participants.map((pid) => {
            const u = getUserById(pid);
            return {
              name: pid === 'user-1' ? 'أنت' : (u?.name || 'غير محدد'),
              share: r1(totalAmt / bill.participants.length),
            };
          }),
        };
      }),
      grandTotal: totals.grand,
      taxAmount: totals.tax,
      tipAmount: totals.tip,
      settlements: settlements.map((s) => {
        const fromUser = getUserById(s.from);
        const toUser = getUserById(s.to);
        return {
          fromName: s.from === 'user-1' ? 'أنت' : (fromUser?.name || 'غير محدد'),
          toName: s.to === 'user-1' ? 'أنت' : (toUser?.name || 'غير محدد'),
          amount: s.amount,
        };
      }),
    });
    setShareMessage(message);
  };

  return (
    <div className="pb-10 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-5 pt-14 pb-8 rounded-b-[2.5rem] relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="flex items-center justify-between mb-5 relative">
          <button
            onClick={() => navigate('group-detail')}
            className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-white font-black text-lg">الحاسبة الذكية</h1>
            <p className="text-indigo-200 text-xs mt-0.5">{group.emoji} {group.name}</p>
          </div>
          <button
            onClick={handleReset}
            className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center"
            title="إعادة تعيين"
          >
            <RotateCcw className="w-4.5 w-[18px] h-[18px] text-white" />
          </button>
        </div>

        {/* Live totals bar */}
        <div className="relative grid grid-cols-4 gap-2">
          {[
            { label: 'قبل الضريبة', value: `${totals.base.toFixed(1)}`, unit: 'ر.س', color: 'text-white' },
            { label: `ضريبة ${effectiveTax}%`, value: `${totals.tax.toFixed(1)}`, unit: 'ر.س', color: 'text-yellow-300' },
            { label: `خدمة ${effectiveTip}%`, value: `${totals.tip.toFixed(1)}`, unit: 'ر.س', color: 'text-emerald-300' },
            { label: 'الإجمالي', value: `${totals.grand.toFixed(1)}`, unit: 'ر.س', color: 'text-white' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 text-center">
              <p className={`font-black text-sm ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-indigo-200 mt-0.5">{s.unit}</p>
              <p className="text-[9px] text-indigo-200/70 leading-3 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* ── Tax & Tip Card ───────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1e1e32] rounded-3xl border border-gray-100 dark:border-[#2d2d4a] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2d2d4a] flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-500" />
            <h2 className="font-black text-gray-900 dark:text-gray-100">الضريبة ونسبة الخدمة</h2>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Tax */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="text-base">🏛️</span> نسبة الضريبة (VAT)
                </label>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-xl">
                  {effectiveTax}%
                </span>
              </div>
              {/* Quick select buttons */}
              <div className="flex gap-2 mb-2">
                {['0', '5', '10', '15', '20'].map((v) => (
                  <button
                    key={v}
                    onClick={() => { setTaxRate(v); setShowResults(false); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                      taxRate === v && !useCustomTip
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a4e]'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              {/* Custom input */}
              <div className="relative">
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => { setTaxRate(e.target.value); setShowResults(false); }}
                  placeholder="أدخل نسبة مخصصة"
                  min="0"
                  max="100"
                  className="w-full bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#3d3d5a] rounded-2xl px-4 py-3 pr-10 text-sm text-right text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium"
                  dir="ltr"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {effectiveTax > 0 && totals.base > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1.5 font-medium">
                  💡 الضريبة = {totals.tax.toFixed(1)} ر.س على إجمالي {totals.base.toFixed(1)} ر.س
                </p>
              )}
            </div>

            {/* Tip */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="text-base">🤝</span> نسبة الخدمة (Tip)
                </label>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                  {effectiveTip}%
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                {['0', '5', '10', '15', '20'].map((v) => (
                  <button
                    key={v}
                    onClick={() => { setTipRate(v); setUseCustomTip(false); setShowResults(false); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                      tipRate === v && !useCustomTip
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a4e]'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={useCustomTip ? customTip : tipRate}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                    setUseCustomTip(true);
                    setShowResults(false);
                  }}
                  placeholder="نسبة مخصصة"
                  min="0"
                  max="100"
                  className="w-full bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#3d3d5a] rounded-2xl px-4 py-3 pr-10 text-sm text-right text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-500/10 transition-all font-medium"
                  dir="ltr"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {effectiveTip > 0 && totals.base > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                  💡 الخدمة = {totals.tip.toFixed(1)} ر.س على إجمالي {totals.base.toFixed(1)} ر.س
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Bill Cards ───────────────────────────────────────── */}
        {bills.map((bill, idx) => {
          const cfg = categoryConfig[bill.category];
          const baseAmt = parseFloat(bill.amount) || 0;
          const taxAmt = r1(baseAmt * (effectiveTax / 100));
          const tipAmt = r1(baseAmt * (effectiveTip / 100));
          const totalAmt = r1(baseAmt + taxAmt + tipAmt);
          const perPerson = bill.participants.length > 0 ? r1(totalAmt / bill.participants.length) : 0;
          const isValid = bill.title.trim() && baseAmt > 0 && bill.participants.length > 0;

          return (
            <div
              key={bill.id}
              className={`bg-white dark:bg-[#1e1e32] rounded-3xl shadow-sm border-2 transition-all overflow-hidden ${
                isValid
                  ? 'border-indigo-200 dark:border-indigo-500/30'
                  : 'border-gray-100 dark:border-[#2d2d4a]'
              }`}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => updateBill(bill.id, { expanded: !bill.expanded })}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.color}`}>
                  {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      #{idx + 1}
                    </span>
                    {isValid ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✅ جاهزة</span>
                    ) : (
                      <span className="text-xs text-orange-500 font-bold">⚠ غير مكتملة</span>
                    )}
                  </div>
                  <p className="font-black text-gray-900 dark:text-gray-100 text-sm mt-0.5 truncate">
                    {bill.title || 'فاتورة جديدة'}
                  </p>
                  {isValid && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {baseAmt.toFixed(1)} + ضريبة {taxAmt.toFixed(1)} + خدمة {tipAmt.toFixed(1)} = <span className="font-black text-indigo-500">{totalAmt.toFixed(1)} ر.س</span>
                      {bill.participants.length > 0 && ` • ${perPerson.toFixed(1)} / شخص`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {bills.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBill(bill.id); }}
                      className="w-8 h-8 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                  {bill.expanded
                    ? <ChevronUp className="w-5 h-5 text-gray-400" />
                    : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {/* Expanded form */}
              {bill.expanded && (
                <div className="px-4 pb-5 space-y-4 border-t border-gray-100 dark:border-[#2d2d4a] pt-4">

                  {/* Title + Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                        اسم الفاتورة *
                      </label>
                      <input
                        type="text"
                        value={bill.title}
                        onChange={(e) => { updateBill(bill.id, { title: e.target.value }); setShowResults(false); }}
                        placeholder="مثال: غداء"
                        className="w-full bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#3d3d5a] rounded-2xl px-3 py-3 text-sm text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                        المبلغ الأساسي *
                      </label>
                      <input
                        type="number"
                        value={bill.amount}
                        onChange={(e) => { updateBill(bill.id, { amount: e.target.value }); setShowResults(false); }}
                        placeholder="0.0"
                        min="0"
                        step="0.5"
                        className="w-full bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#3d3d5a] rounded-2xl px-3 py-3 text-sm text-left text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Live breakdown for this bill */}
                  {baseAmt > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">الأساسي</p>
                        <p className="font-black text-gray-900 dark:text-gray-100 text-sm">{baseAmt.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">+ ضريبة</p>
                        <p className="font-black text-yellow-600 dark:text-yellow-400 text-sm">{taxAmt.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">+ خدمة</p>
                        <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{tipAmt.toFixed(1)}</p>
                      </div>
                      <div className="col-span-3 border-t border-indigo-100 dark:border-indigo-500/20 pt-2">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">الإجمالي بعد الضريبة والخدمة</p>
                        <p className="font-black text-indigo-700 dark:text-indigo-300 text-lg">{totalAmt.toFixed(1)} <span className="text-sm">ر.س</span></p>
                        {bill.participants.length > 0 && (
                          <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
                            ÷ {bill.participants.length} أشخاص = <span className="font-black">{perPerson.toFixed(1)} ر.س / شخص</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-2">التصنيف</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {(Object.entries(categoryConfig) as [BillCategory, typeof categoryConfig[BillCategory]][]).map(([key, c]) => (
                        <button
                          key={key}
                          onClick={() => updateBill(bill.id, { category: key })}
                          className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 transition-all ${
                            bill.category === key
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 scale-105'
                              : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#1e1e32]'
                          }`}
                        >
                          <span className="text-lg">{c.emoji}</span>
                          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paid By */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-2">
                      💳 من دفع الفاتورة؟
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {memberIds.map((uid) => {
                        const user = getUserById(uid);
                        if (!user) return null;
                        const isSelected = bill.paidBy === uid;
                        return (
                          <button
                            key={uid}
                            onClick={() => { updateBill(bill.id, { paidBy: uid }); setShowResults(false); }}
                            className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15'
                                : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#1e1e32]'
                            }`}
                          >
                            <span className="text-xl">{user.avatar}</span>
                            <span className={`text-[10px] font-bold whitespace-nowrap ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              {uid === 'user-1' ? 'أنا' : user.name.split(' ')[0]}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        المشمولون في الفاتورة
                      </label>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          {bill.participants.length}/{memberIds.length}
                        </span>
                        {/* Select All */}
                        <button
                          onClick={() => { updateBill(bill.id, { participants: [...memberIds] }); setShowResults(false); }}
                          className="text-xs text-indigo-500 font-bold"
                        >
                          الكل
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {memberIds.map((uid) => {
                        const user = getUserById(uid);
                        if (!user) return null;
                        const isIn = bill.participants.includes(uid);
                        const isPayer = bill.paidBy === uid;
                        const myShare = isIn && bill.participants.length > 0
                          ? r1(
                              (parseFloat(bill.amount) || 0) *
                              (1 + effectiveTax / 100 + effectiveTip / 100) /
                              bill.participants.length
                            )
                          : 0;

                        return (
                          <button
                            key={uid}
                            onClick={() => toggleParticipant(bill.id, uid)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition-all ${
                              isIn
                                ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'border-gray-100 dark:border-[#2d2d4a] bg-white dark:bg-[#1e1e32] opacity-60'
                            }`}
                          >
                            <div className="relative">
                              <span className="text-xl">{user.avatar}</span>
                              {isPayer && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-[7px] font-black">$</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-right min-w-0">
                              <p className={`text-xs font-bold truncate ${isIn ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}>
                                {uid === 'user-1' ? 'أنا' : user.name.split(' ')[0]}
                              </p>
                              {isIn && myShare > 0 && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  {myShare.toFixed(1)} ر.س
                                </p>
                              )}
                            </div>
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isIn ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#3a3a4e]'
                            }`}>
                              {isIn && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {bill.participants.length === 0 && (
                      <div className="flex items-center gap-2 mt-2 text-red-500">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs font-bold">يجب اختيار شخص واحد على الأقل</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Add Bill ─────────────────────────────────────────── */}
        <button
          onClick={addBill}
          className="w-full bg-white dark:bg-[#1e1e32] rounded-3xl p-4 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-3 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all"
        >
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="font-black text-indigo-600 dark:text-indigo-400">إضافة فاتورة أخرى</span>
        </button>

        {/* ── Grand Total Preview ──────────────────────────────── */}
        {canCalculate && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">ملخص قبل الحساب</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{validBills.length} فاتورة • المجموع الأساسي</span>
                <span className="font-black text-gray-900 dark:text-gray-100">{totals.base.toFixed(1)} ر.س</span>
              </div>
              {effectiveTax > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">ضريبة {effectiveTax}%</span>
                  <span className="font-black text-yellow-600 dark:text-yellow-400">+ {totals.tax.toFixed(1)} ر.س</span>
                </div>
              )}
              {effectiveTip > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">خدمة {effectiveTip}%</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+ {totals.tip.toFixed(1)} ر.س</span>
                </div>
              )}
              <div className="border-t border-indigo-100 dark:border-indigo-500/20 pt-2 flex justify-between items-center">
                <span className="font-black text-indigo-700 dark:text-indigo-300">الإجمالي النهائي</span>
                <span className="font-black text-xl text-indigo-700 dark:text-indigo-300">{totals.grand.toFixed(1)} ر.س</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Validation Error Alert ───────────────────────────── */}
        {calcError && (
          <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-3xl px-5 py-4 flex items-start gap-3 animate-slide-up">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-700 dark:text-red-400 text-sm">خطأ في البيانات</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-medium">{calcError}</p>
            </div>
            <button onClick={() => setCalcError(null)} className="mr-auto w-6 h-6 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        )}

        {/* ── CALCULATE BUTTON ─────────────────────────────────── */}
        <button
          onClick={handleCalculate}
          disabled={!canCalculate}
          className={`w-full py-5 rounded-3xl font-black text-base flex items-center justify-center gap-3 transition-all ${
            canCalculate
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5'
              : 'bg-gray-200 dark:bg-[#2a2a3e] text-gray-400 cursor-not-allowed'
          }`}
        >
          <Calculator className="w-6 h-6" />
          <span>احسب التقسيم النهائي</span>
          <Sparkles className="w-5 h-5" />
        </button>

        {/* ════════════════════════════════════════════════════════
             RESULTS SECTION
        ════════════════════════════════════════════════════════ */}
        {showResults && (
          <div id="results-section" className="space-y-4 animate-slide-up">

            {/* Results Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-5 text-center text-white shadow-xl shadow-emerald-500/20">
              <div className="text-3xl mb-2">🎯</div>
              <h2 className="font-black text-xl mb-1">نتائج التقسيم</h2>
              <p className="text-emerald-100 text-sm">
                الإجمالي <span className="font-black text-white">{totals.grand.toFixed(1)} ر.س</span> على {memberIds.length} أشخاص
              </p>
              {(effectiveTax > 0 || effectiveTip > 0) && (
                <div className="flex justify-center gap-3 mt-3">
                  {effectiveTax > 0 && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                      ضريبة {effectiveTax}% ({totals.tax.toFixed(1)} ر.س)
                    </span>
                  )}
                  {effectiveTip > 0 && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                      خدمة {effectiveTip}% ({totals.tip.toFixed(1)} ر.س)
                    </span>
                  )}
                </div>
              )}
              {/* WhatsApp Share */}
              <button
                onClick={handleWhatsAppShare}
                className="mt-4 w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#17a852] text-white py-3 rounded-2xl font-black text-sm shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>مشاركة النتائج عبر واتساب</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-[#1e1e32] rounded-3xl shadow-sm border border-gray-100 dark:border-[#2d2d4a] p-1.5 flex gap-1">
              {[
                { key: 'summary', label: 'الملخص', icon: TrendingUp },
                { key: 'details', label: 'التفاصيل', icon: Receipt },
                { key: 'settlements', label: 'التسويات', icon: DollarSign },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as typeof activeTab)}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === t.key
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                  {t.key === 'settlements' && settlements.length > 0 && (
                    <span className="bg-white/30 rounded-full px-1.5 text-[10px] font-black">
                      {settlements.filter((s) => !s.settled).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab: Summary ─────────────────────────────────── */}
            {activeTab === 'summary' && (
              <div className="bg-white dark:bg-[#1e1e32] rounded-3xl border border-gray-100 dark:border-[#2d2d4a] overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 dark:bg-[#1a1a2e] border-b border-gray-100 dark:border-[#2d2d4a]">
                  <span className="col-span-4 text-xs font-black text-gray-500 dark:text-gray-400">الشخص</span>
                  <span className="col-span-3 text-xs font-black text-gray-500 dark:text-gray-400 text-center">دفع</span>
                  <span className="col-span-3 text-xs font-black text-gray-500 dark:text-gray-400 text-center">عليه</span>
                  <span className="col-span-2 text-xs font-black text-gray-500 dark:text-gray-400 text-left">صافي</span>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-[#2d2d4a]">
                  {personResults.map((person) => {
                    const user = getUserById(person.userId);
                    if (!user) return null;
                    const isCreditor = person.netBalance > 0.05;
                    const isDebtor = person.netBalance < -0.05;
                    const isEven = !isCreditor && !isDebtor;

                    return (
                      <div key={person.userId}>
                        <button
                          className="w-full grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          onClick={() => setExpandedPerson(expandedPerson === person.userId ? null : person.userId)}
                        >
                          <div className="col-span-4 flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                              isCreditor ? 'bg-emerald-50 dark:bg-emerald-500/10'
                              : isDebtor ? 'bg-red-50 dark:bg-red-500/10'
                              : 'bg-gray-100 dark:bg-[#2a2a3e]'
                            }`}>
                              {user.avatar}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-gray-900 dark:text-gray-100 leading-4">
                                {person.userId === 'user-1' ? 'أنا' : user.name.split(' ')[0]}
                              </p>
                              <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform inline-block ${expandedPerson === person.userId ? 'rotate-90' : ''}`} />
                            </div>
                          </div>
                          <div className="col-span-3 text-center">
                            <p className="font-black text-sm text-blue-600 dark:text-blue-400">{person.totalPaid.toFixed(1)}</p>
                            <p className="text-[9px] text-gray-400">ر.س</p>
                          </div>
                          <div className="col-span-3 text-center">
                            <p className="font-black text-sm text-gray-700 dark:text-gray-300">{person.totalOwed.toFixed(1)}</p>
                            <p className="text-[9px] text-gray-400">ر.س</p>
                          </div>
                          <div className="col-span-2 text-left">
                            <p className={`font-black text-sm ${
                              isCreditor ? 'text-emerald-600 dark:text-emerald-400'
                              : isDebtor ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-400'
                            }`}>
                              {isEven ? '—' : `${isCreditor ? '+' : ''}${fmt(person.netBalance)}`}
                            </p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isCreditor ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : isDebtor ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                            }`}>
                              {isCreditor ? 'دائن' : isDebtor ? 'مدين' : '±0'}
                            </span>
                          </div>
                        </button>

                        {/* Expanded person detail */}
                        {expandedPerson === person.userId && (
                          <div className="px-5 pb-3 bg-gray-50 dark:bg-[#1a1a2e] space-y-2">
                            <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2">تفاصيل الفواتير:</p>
                            {person.billBreakdown.map((bd) => (
                              <div key={bd.billId} className="bg-white dark:bg-[#1e1e32] rounded-2xl p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-black text-gray-800 dark:text-gray-200">{bd.billTitle}</span>
                                  {bd.isPayer && (
                                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">الدافع</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center">
                                  <div>
                                    <p className="text-[10px] text-gray-400">الأساسي</p>
                                    <p className="text-xs font-black text-gray-700 dark:text-gray-300">{bd.baseShare.toFixed(1)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-yellow-500">ضريبة</p>
                                    <p className="text-xs font-black text-yellow-600 dark:text-yellow-400">{bd.taxShare.toFixed(1)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-emerald-500">خدمة</p>
                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{bd.tipShare.toFixed(1)}</p>
                                  </div>
                                </div>
                                <div className="border-t border-gray-100 dark:border-[#2d2d4a] mt-2 pt-1.5 flex justify-between">
                                  <span className="text-[10px] text-gray-500">حصتي الكاملة</span>
                                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{bd.totalShare.toFixed(1)} ر.س</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer totals */}
                <div className="px-5 py-3.5 bg-indigo-50 dark:bg-indigo-500/10 border-t border-indigo-100 dark:border-indigo-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">الإجمالي الكلي</span>
                    <span className="font-black text-lg text-indigo-700 dark:text-indigo-300">{totals.grand.toFixed(1)} ر.س</span>
                  </div>
                  {(effectiveTax > 0 || effectiveTip > 0) && (
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
                      يشمل {effectiveTax}% ضريبة و{effectiveTip}% خدمة
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: Details ─────────────────────────────────── */}
            {activeTab === 'details' && (
              <div className="space-y-3">
                {validBills.map((bill) => {
                  const cfg = categoryConfig[bill.category];
                  const baseAmt = parseFloat(bill.amount);
                  const taxAmt = r1(baseAmt * (effectiveTax / 100));
                  const tipAmt = r1(baseAmt * (effectiveTip / 100));
                  const totalAmt = r1(baseAmt + taxAmt + tipAmt);
                  const perPerson = r1(totalAmt / bill.participants.length);
                  const payer = getUserById(bill.paidBy);

                  return (
                    <div key={bill.id} className="bg-white dark:bg-[#1e1e32] rounded-3xl border border-gray-100 dark:border-[#2d2d4a] overflow-hidden shadow-sm">
                      <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100 dark:border-[#2d2d4a]">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${cfg.color}`}>
                          {cfg.emoji}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-gray-900 dark:text-gray-100">{bill.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            دفعها {payer?.name.split(' ')[0]} • {bill.participants.length} أشخاص
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{totalAmt.toFixed(1)} ر.س</p>
                          <p className="text-xs text-gray-400">{perPerson.toFixed(1)} / شخص</p>
                        </div>
                      </div>

                      {/* Bill breakdown */}
                      <div className="px-5 py-3 bg-gray-50 dark:bg-[#1a1a2e] grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1">المبلغ الأساسي</p>
                          <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{baseAmt.toFixed(1)} ر.س</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-yellow-500 mb-1">+ ضريبة {effectiveTax}%</p>
                          <p className="font-black text-yellow-600 dark:text-yellow-400 text-sm">{taxAmt.toFixed(1)} ر.س</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-500 mb-1">+ خدمة {effectiveTip}%</p>
                          <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{tipAmt.toFixed(1)} ر.س</p>
                        </div>
                      </div>

                      {/* Per person */}
                      <div className="px-5 py-3 divide-y divide-gray-50 dark:divide-[#2d2d4a]">
                        {bill.participants.map((pid) => {
                          const u = getUserById(pid);
                          const isPayer = pid === bill.paidBy;
                          return (
                            <div key={pid} className="py-2 flex items-center gap-2.5">
                              <span className="text-lg">{u?.avatar}</span>
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex-1">
                                {pid === 'user-1' ? 'أنا' : u?.name.split(' ')[0]}
                                {isPayer && <span className="text-xs text-indigo-500 mr-1">(الدافع)</span>}
                              </span>
                              <div className="text-left">
                                <span className="font-black text-sm text-gray-900 dark:text-gray-100">{perPerson.toFixed(1)}</span>
                                <span className="text-xs text-gray-400"> ر.س</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Tab: Settlements ─────────────────────────────── */}
            {activeTab === 'settlements' && (
              <div className="space-y-3">
                {settlements.length === 0 ? (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-8 text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="font-black text-emerald-700 dark:text-emerald-400 text-xl mb-1">لا حسابات معلقة!</p>
                    <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm">كل شخص دفع حصته بالكامل</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                        {settlements.length} تحويل فقط لتصفير جميع الحسابات
                        {allSettled && ' — تمت التسوية الكاملة! 🎉'}
                      </p>
                    </div>

                    {settlements.map((s, i) => {
                      const fromUser = getUserById(s.from);
                      const toUser = getUserById(s.to);
                      return (
                        <div
                          key={i}
                          className={`bg-white dark:bg-[#1e1e32] rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${
                            s.settled
                              ? 'border-emerald-200 dark:border-emerald-500/30 opacity-70'
                              : 'border-gray-100 dark:border-[#2d2d4a]'
                          }`}
                        >
                          <div className="px-5 py-4 flex items-center gap-4">
                            {/* From */}
                            <div className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl ${
                                s.settled ? 'bg-gray-100 dark:bg-[#2a2a3e]' : 'bg-red-50 dark:bg-red-500/10'
                              }`}>
                                {fromUser?.avatar}
                              </div>
                              <p className="text-xs font-black text-gray-700 dark:text-gray-300 text-center">
                                {s.from === 'user-1' ? 'أنا' : fromUser?.name.split(' ')[0]}
                              </p>
                              <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">مدين</span>
                            </div>

                            {/* Arrow + Amount */}
                            <div className="flex flex-col items-center gap-1">
                              <div className={`px-3 py-2 rounded-2xl font-black text-base ${
                                s.settled
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                              }`}>
                                {s.amount.toFixed(1)} ر.س
                              </div>
                              <div className="flex items-center gap-1 text-gray-300 dark:text-gray-600">
                                <div className="h-0.5 w-5 bg-current" />
                                <span className="text-[10px] text-gray-400">يدفع لـ</span>
                                <div className="h-0.5 w-5 bg-current" />
                              </div>
                            </div>

                            {/* To */}
                            <div className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl ${
                                s.settled ? 'bg-gray-100 dark:bg-[#2a2a3e]' : 'bg-emerald-50 dark:bg-emerald-500/10'
                              }`}>
                                {toUser?.avatar}
                              </div>
                              <p className="text-xs font-black text-gray-700 dark:text-gray-300 text-center">
                                {s.to === 'user-1' ? 'أنا' : toUser?.name.split(' ')[0]}
                              </p>
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">دائن</span>
                            </div>

                            {/* Settle button */}
                            <button
                              onClick={() => toggleSettlement(i)}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                                s.settled
                                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                                  : 'bg-gray-100 dark:bg-[#2a2a3e] hover:bg-gray-200 dark:hover:bg-[#3a3a4e]'
                              }`}
                            >
                              <Check className={`w-5 h-5 ${s.settled ? 'text-white' : 'text-gray-400'}`} />
                            </button>
                          </div>

                          {s.settled && (
                            <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border-t border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">تمت التسوية</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {allSettled && (
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-300 dark:border-emerald-500/40 rounded-3xl p-5 text-center">
                        <div className="text-4xl mb-2">🥳</div>
                        <p className="font-black text-emerald-700 dark:text-emerald-400 text-lg">كل الحسابات صافية!</p>
                        <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm mt-1">تمت تسوية جميع المدفوعات بنجاح</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="h-4" />
          </div>
        )}

        <div className="h-4" />
      </div>

      {shareMessage && (
        <ShareModal message={shareMessage} onClose={() => setShareMessage(null)} />
      )}
    </div>
  );
}
