import { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { categoryConfig } from '@/utils/helpers';
import type { BillCategory } from '@/types';
import {
  ArrowRight, Plus, Trash2, ChevronDown, ChevronUp,
  DollarSign, Users, Check, Calculator, TrendingUp,
  Receipt, AlertCircle, Sparkles
} from 'lucide-react';
import { buildWhatsAppMessage } from '@/utils/whatsapp';
import { ShareModal } from '@/components/ShareModal';

// ─── Types ────────────────────────────────────────────────────
interface BillEntry {
  id: string;
  title: string;
  amount: string;
  category: BillCategory;
  paidBy: string;
  participants: string[];
  expanded: boolean;
}

interface NetBalance {
  userId: string;
  net: number;       // positive = creditor (يطلب)، negative = debtor (مدين)
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// ─── Helper: compute net balances ─────────────────────────────
function computeBalances(bills: BillEntry[], memberIds: string[]): NetBalance[] {
  const balances: Record<string, number> = {};
  memberIds.forEach((id) => { balances[id] = 0; });

  bills.forEach((bill) => {
    const amt = parseFloat(bill.amount) || 0;
    if (amt <= 0 || bill.participants.length === 0) return;

    const share = amt / bill.participants.length;

    bill.participants.forEach((pid) => {
      if (pid === bill.paidBy) {
        // الدافع يأخذ حصص الآخرين ← يكسب
        balances[pid] = (balances[pid] || 0) + (amt - share);
      } else {
        // كل مشارك آخر يدفع حصته ← يخسر
        balances[pid] = (balances[pid] || 0) - share;
      }
    });
  });

  return memberIds.map((id) => ({ userId: id, net: Math.round((balances[id] || 0) * 100) / 100 }));
}

// ─── Helper: compute minimal settlements ──────────────────────
function computeSettlements(netBalances: NetBalance[]): Settlement[] {
  const creditors = netBalances.filter((b) => b.net > 0.01).sort((a, b) => b.net - a.net);
  const debtors   = netBalances.filter((b) => b.net < -0.01).sort((a, b) => a.net - b.net);

  const cred = creditors.map((c) => ({ ...c }));
  const debt = debtors.map((d) => ({ ...d }));
  const settlements: Settlement[] = [];

  let ci = 0, di = 0;
  while (ci < cred.length && di < debt.length) {
    const amount = Math.min(cred[ci].net, -debt[di].net);
    settlements.push({ from: debt[di].userId, to: cred[ci].userId, amount: Math.round(amount * 100) / 100 });
    cred[ci].net -= amount;
    debt[di].net += amount;
    if (Math.abs(cred[ci].net) < 0.01) ci++;
    if (Math.abs(debt[di].net) < 0.01) di++;
  }
  return settlements;
}

// ─── Component ────────────────────────────────────────────────
export function MultiBillScreen() {
  const { navigate, selectedGroupId, groups, getUserById } = useApp();

  const group = groups.find((g) => g.id === selectedGroupId);
  const members = group?.members ?? [];
  const memberIds = members.map((m) => m.userId);

  // ── state
  const [bills, setBills] = useState<BillEntry[]>([
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
  const [showSummary, setShowSummary] = useState(false);
  const [settledPayments, setSettledPayments] = useState<Set<number>>(new Set());
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  // ── helpers
  const updateBill = useCallback((id: string, patch: Partial<BillEntry>) => {
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
  }, [memberIds]);

  const removeBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const toggleParticipant = useCallback((billId: string, userId: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== billId) return b;
        const has = b.participants.includes(userId);
        const next = has ? b.participants.filter((p) => p !== userId) : [...b.participants, userId];
        return { ...b, participants: next };
      })
    );
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, expanded: !b.expanded } : b)));
  }, []);

  // ── computed
  const totalAmount = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const validBills  = bills.filter((b) => b.title.trim() && parseFloat(b.amount) > 0 && b.participants.length > 0);
  const netBalances = computeBalances(bills, memberIds);
  const settlements = computeSettlements(netBalances);

  const canShowSummary = validBills.length > 0;

  const handleWhatsAppShare = () => {
    const message = buildWhatsAppMessage({
      groupName: group?.name || 'المجموعة',
      groupEmoji: group?.emoji || '📋',
      bills: validBills.map((bill) => {
        const amt = parseFloat(bill.amount) || 0;
        const payer = getUserById(bill.paidBy);
        return {
          title: bill.title,
          baseAmount: amt,
          totalAmount: amt,
          paidByName: payer?.name || 'غير محدد',
          participants: bill.participants.map((pid) => {
            const u = getUserById(pid);
            return {
              name: pid === 'user-1' ? 'أنت' : (u?.name || 'غير محدد'),
              share: Math.round((amt / bill.participants.length) * 10) / 10,
            };
          }),
        };
      }),
      grandTotal: validBills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0),
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

  if (!group) return null;

  return (
    <div className="pb-10 min-h-screen dark:bg-[#0f0f1a] bg-[#f0f4ff]" dir="rtl">
      {/* ── Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-5 pt-14 pb-8 rounded-b-[2.5rem] relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="flex items-center justify-between mb-4 relative">
          <button
            onClick={() => navigate('group-detail')}
            className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-white font-black text-lg">تعدد الفواتير</h1>
            <p className="text-indigo-200 text-xs mt-0.5">{group.emoji} {group.name}</p>
          </div>
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative grid grid-cols-3 gap-2 mt-2">
          {[
            { label: 'الفواتير', value: bills.length, icon: Receipt },
            { label: 'الإجمالي', value: `${totalAmount.toFixed(0)} ر.س`, icon: DollarSign },
            { label: 'صالحة', value: validBills.length, icon: Check },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
              <s.icon className="w-4 h-4 text-indigo-200 mx-auto mb-1" />
              <p className="text-white font-black text-sm">{s.value}</p>
              <p className="text-indigo-200 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* ── Bill Cards */}
        {bills.map((bill, idx) => {
          const cfg = categoryConfig[bill.category];
          const amt = parseFloat(bill.amount) || 0;
          const perPerson = bill.participants.length > 0 ? amt / bill.participants.length : 0;
          const isValid = bill.title.trim() && amt > 0 && bill.participants.length > 0;

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
                onClick={() => toggleExpand(bill.id)}
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
                  {amt > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {amt.toFixed(0)} ر.س • {bill.participants.length} أشخاص • {perPerson.toFixed(1)} للشخص
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
                  {bill.expanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded form */}
              {bill.expanded && (
                <div className="px-4 pb-5 space-y-4 border-t border-gray-100 dark:border-[#2d2d4a] pt-4">
                  {/* Title + Amount row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                        اسم الفاتورة *
                      </label>
                      <input
                        type="text"
                        value={bill.title}
                        onChange={(e) => updateBill(bill.id, { title: e.target.value })}
                        placeholder="مثال: غداء"
                        className="w-full bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#3d3d5a] rounded-2xl px-3 py-3 text-sm text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                        المبلغ (ر.س) *
                      </label>
                      <input
                        type="number"
                        value={bill.amount}
                        onChange={(e) => updateBill(bill.id, { amount: e.target.value })}
                        placeholder="0"
                        className="w-full bg-gray-50 dark:bg-[#2a2a3e] border-2 border-gray-200 dark:border-[#3d3d5a] rounded-2xl px-3 py-3 text-sm text-left text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all font-medium"
                        dir="ltr"
                      />
                    </div>
                  </div>

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
                      💳 من دفع؟
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {memberIds.map((uid) => {
                        const user = getUserById(uid);
                        if (!user) return null;
                        const isSelected = bill.paidBy === uid;
                        return (
                          <button
                            key={uid}
                            onClick={() => updateBill(bill.id, { paidBy: uid })}
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
                      <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {bill.participants.length}/{memberIds.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {memberIds.map((uid) => {
                        const user = getUserById(uid);
                        if (!user) return null;
                        const isIn = bill.participants.includes(uid);
                        const isPayer = bill.paidBy === uid;
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
                              {isIn && perPerson > 0 && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  {perPerson.toFixed(1)} ر.س
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

        {/* ── Add Bill Button */}
        <button
          onClick={addBill}
          className="w-full bg-white dark:bg-[#1e1e32] rounded-3xl p-4 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-3 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all"
        >
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="font-black text-indigo-600 dark:text-indigo-400">إضافة فاتورة أخرى</span>
        </button>

        {/* ── Calculate / Summary Button */}
        {canShowSummary && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-3xl font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              {showSummary ? 'إخفاء النتيجة' : 'احسب صافي المستحقات'}
              <Sparkles className="w-4 h-4" />
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#17a852] text-white py-4 rounded-3xl font-black text-base shadow-xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>مشاركة عبر واتساب</span>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
             NET BALANCE SUMMARY TABLE
        ══════════════════════════════════════════ */}
        {showSummary && canShowSummary && (
          <div className="space-y-4 animate-slide-up">
            {/* Bills breakdown */}
            <div className="bg-white dark:bg-[#1e1e32] rounded-3xl border border-gray-100 dark:border-[#2d2d4a] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2d2d4a] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-500" />
                <h2 className="font-black text-gray-900 dark:text-gray-100">ملخص الفواتير</h2>
                <span className="mr-auto text-sm font-black text-indigo-500">{validBills.length} فاتورة</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-[#2d2d4a]">
                {validBills.map((bill) => {
                  const cfg = categoryConfig[bill.category];
                  const payer = getUserById(bill.paidBy);
                  const amt = parseFloat(bill.amount);
                  const perP = amt / bill.participants.length;
                  return (
                    <div key={bill.id} className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${cfg.color}`}>
                          {cfg.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-gray-900 dark:text-gray-100 text-sm">{bill.title}</span>
                            <span className="font-black text-gray-900 dark:text-gray-100 text-sm">{amt.toFixed(0)} ر.س</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              دفعها: {payer?.name.split(' ')[0]} • {bill.participants.length} أشخاص
                            </span>
                            <span className="text-xs text-indigo-500 font-bold">{perP.toFixed(1)} / شخص</span>
                          </div>
                          {/* Participants avatars */}
                          <div className="flex gap-1 mt-1.5">
                            {bill.participants.map((pid) => {
                              const u = getUserById(pid);
                              return (
                                <span
                                  key={pid}
                                  className="w-6 h-6 bg-gray-100 dark:bg-[#2a2a3e] rounded-lg flex items-center justify-center text-sm"
                                  title={u?.name}
                                >
                                  {u?.avatar}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3.5 bg-gray-50 dark:bg-[#1a1a2e] flex items-center justify-between">
                <span className="font-black text-gray-700 dark:text-gray-300">الإجمالي</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">
                  {validBills.reduce((s, b) => s + parseFloat(b.amount), 0).toFixed(0)} ر.س
                </span>
              </div>
            </div>

            {/* Net Balance Table */}
            <div className="bg-white dark:bg-[#1e1e32] rounded-3xl border border-gray-100 dark:border-[#2d2d4a] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2d2d4a] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h2 className="font-black text-gray-900 dark:text-gray-100">صافي المستحقات</h2>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-3 px-5 py-2 bg-gray-50 dark:bg-[#1a1a2e]">
                <span className="text-xs font-black text-gray-500 dark:text-gray-400">الشخص</span>
                <span className="text-xs font-black text-gray-500 dark:text-gray-400 text-center">الدور</span>
                <span className="text-xs font-black text-gray-500 dark:text-gray-400 text-left">المبلغ</span>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-[#2d2d4a]">
                {netBalances.map(({ userId, net }) => {
                  const user = getUserById(userId);
                  if (!user) return null;
                  const isCreditor = net > 0.01;
                  const isDebtor   = net < -0.01;
                  const isEven     = !isCreditor && !isDebtor;

                  return (
                    <div key={userId} className="px-5 py-4 flex items-center gap-3">
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${
                          isCreditor ? 'bg-emerald-50 dark:bg-emerald-500/10'
                          : isDebtor  ? 'bg-red-50 dark:bg-red-500/10'
                          : 'bg-gray-100 dark:bg-[#2a2a3e]'
                        }`}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {userId === 'user-1' ? 'أنت' : user.name.split(' ')[0]}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{user.name.split(' ').slice(1).join(' ')}</p>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div className="flex-1 flex justify-center">
                        <span className={`text-xs font-black px-3 py-1.5 rounded-full ${
                          isCreditor ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : isDebtor  ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                        }`}>
                          {isCreditor ? '💰 دائن' : isDebtor ? '📤 مدين' : '✅ متعادل'}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="text-left flex-1">
                        <p className={`font-black text-lg ${
                          isCreditor ? 'text-emerald-600 dark:text-emerald-400'
                          : isDebtor  ? 'text-red-500 dark:text-red-400'
                          : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {isEven ? '—' : `${isCreditor ? '+' : ''}${net.toFixed(1)}`}
                        </p>
                        {!isEven && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">ر.س</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-[#1a1a2e] flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">دائن = يطلب مال</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">مدين = عليه مال</span>
                </div>
              </div>
            </div>

            {/* Optimal Settlements */}
            {settlements.length > 0 && (
              <div className="bg-white dark:bg-[#1e1e32] rounded-3xl border border-gray-100 dark:border-[#2d2d4a] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2d2d4a]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-base">🤝</span>
                    </div>
                    <div>
                      <h2 className="font-black text-gray-900 dark:text-gray-100">خطة التسوية المثلى</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">أقل عدد من التحويلات لتصفير الحسابات</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-[#2d2d4a]">
                  {settlements.map((s, i) => {
                    const fromUser = getUserById(s.from);
                    const toUser   = getUserById(s.to);
                    const isSettled = settledPayments.has(i);
                    return (
                      <div key={i} className={`px-5 py-4 transition-all ${isSettled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                          {/* From */}
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                              isSettled ? 'bg-gray-100 dark:bg-[#2a2a3e]' : 'bg-red-50 dark:bg-red-500/10'
                            }`}>
                              {fromUser?.avatar}
                            </div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center w-16 truncate">
                              {s.from === 'user-1' ? 'أنا' : fromUser?.name.split(' ')[0]}
                            </p>
                          </div>

                          {/* Arrow + Amount */}
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <div className={`px-4 py-2 rounded-2xl font-black text-sm ${
                              isSettled
                                ? 'bg-gray-100 dark:bg-[#2a2a3e] text-gray-400'
                                : 'bg-gradient-to-r from-red-50 to-indigo-50 dark:from-red-500/10 dark:to-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                            }`}>
                              {s.amount.toFixed(1)} ر.س
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <div className="h-0.5 w-8 bg-gray-200 dark:bg-[#3d3d5a]" />
                              <span className="text-xs">يدفع لـ</span>
                              <div className="h-0.5 w-8 bg-gray-200 dark:bg-[#3d3d5a]" />
                            </div>
                          </div>

                          {/* To */}
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                              isSettled ? 'bg-gray-100 dark:bg-[#2a2a3e]' : 'bg-emerald-50 dark:bg-emerald-500/10'
                            }`}>
                              {toUser?.avatar}
                            </div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center w-16 truncate">
                              {s.to === 'user-1' ? 'أنا' : toUser?.name.split(' ')[0]}
                            </p>
                          </div>

                          {/* Mark settled */}
                          <button
                            onClick={() => {
                              setSettledPayments((prev) => {
                                const next = new Set(prev);
                                next.has(i) ? next.delete(i) : next.add(i);
                                return next;
                              });
                            }}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                              isSettled
                                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                                : 'bg-gray-100 dark:bg-[#2a2a3e] hover:bg-gray-200 dark:hover:bg-[#3a3a4e]'
                            }`}
                          >
                            <Check className={`w-5 h-5 ${isSettled ? 'text-white' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* All settled */}
                {settledPayments.size === settlements.length && (
                  <div className="px-5 py-4 bg-emerald-50 dark:bg-emerald-500/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-emerald-700 dark:text-emerald-400">تمت التسوية الكاملة! 🎉</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">كل الحسابات صافية الآن</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {settlements.length === 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-6 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-black text-emerald-700 dark:text-emerald-400 text-lg">لا حسابات معلقة!</p>
                <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm mt-1">كل شخص دفع حصته بالكامل</p>
              </div>
            )}
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
