// ============================================
// WhatsApp Share Utility
// ============================================

export interface WhatsAppBillData {
  groupName: string;
  groupEmoji: string;
  bills: {
    title: string;
    baseAmount: number;
    taxRate?: number;
    tipRate?: number;
    totalAmount: number;
    paidByName: string;
    participants: { name: string; share: number }[];
  }[];
  grandTotal: number;
  taxAmount?: number;
  tipAmount?: number;
  settlements: {
    fromName: string;
    toName: string;
    amount: number;
  }[];
  currency?: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function buildWhatsAppMessage(data: WhatsAppBillData): string {
  const currency = data.currency || 'ر.س';
  const lines: string[] = [];

  // ── Header ──────────────────────────────────────
  lines.push(`💰 *تقسيم الفواتير - قسّمها*`);
  lines.push(`${data.groupEmoji} *${data.groupName}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  // ── Bills Breakdown ──────────────────────────────
  if (data.bills.length > 0) {
    lines.push(`\n📋 *تفاصيل الفواتير (${data.bills.length}):*`);

    data.bills.forEach((bill, idx) => {
      lines.push(`\n*${idx + 1}. ${bill.title}*`);

      if ((bill.taxRate && bill.taxRate > 0) || (bill.tipRate && bill.tipRate > 0)) {
        lines.push(`  • المبلغ الأساسي: ${r1(bill.baseAmount).toFixed(1)} ${currency}`);
        if (bill.taxRate && bill.taxRate > 0) {
          const taxAmt = r1(bill.baseAmount * bill.taxRate / 100);
          lines.push(`  • الضريبة (${bill.taxRate}%): ${taxAmt.toFixed(1)} ${currency}`);
        }
        if (bill.tipRate && bill.tipRate > 0) {
          const tipAmt = r1(bill.baseAmount * bill.tipRate / 100);
          lines.push(`  • الخدمة (${bill.tipRate}%): ${tipAmt.toFixed(1)} ${currency}`);
        }
        lines.push(`  • الإجمالي: *${r1(bill.totalAmount).toFixed(1)} ${currency}*`);
      } else {
        lines.push(`  • الإجمالي: *${r1(bill.totalAmount).toFixed(1)} ${currency}*`);
      }

      lines.push(`  • دفعها: ${bill.paidByName}`);
      lines.push(`  • المشمولون (${bill.participants.length} أشخاص):`);

      bill.participants.forEach((p) => {
        lines.push(`    ◦ ${p.name}: *${p.share.toFixed(1)} ${currency}*`);
      });
    });
  }

  // ── Grand Total ───────────────────────────────────
  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💵 *الإجمالي الكلي: ${r1(data.grandTotal).toFixed(1)} ${currency}*`);

  if (data.taxAmount && data.taxAmount > 0) {
    lines.push(`  ┗ الضريبة: ${r1(data.taxAmount).toFixed(1)} ${currency}`);
  }
  if (data.tipAmount && data.tipAmount > 0) {
    lines.push(`  ┗ الخدمة: ${r1(data.tipAmount).toFixed(1)} ${currency}`);
  }

  // ── Settlements ───────────────────────────────────
  if (data.settlements.length > 0) {
    lines.push(`\n🤝 *خطة التسوية (${data.settlements.length} تحويل):*`);
    data.settlements.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.fromName} ← يدفع → ${s.toName}: *${r1(s.amount).toFixed(1)} ${currency}*`);
    });
  } else {
    lines.push(`\n✅ *لا حسابات معلقة - الكل مسوّى!*`);
  }

  // ── Footer ────────────────────────────────────────
  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📲 تم الإرسال من تطبيق *قسّمها* 💜`);

  return lines.join('\n');
}

// ── هذه الدالة القديمة أُبقيت للتوافقية فقط - لا تستخدمها مباشرة
// استخدم ShareModal بدلاً منها
export function openWhatsApp(message: string, phoneNumber?: string): void {
  const encoded = encodeURIComponent(message);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  let appUrl: string;
  let webUrl: string;

  if (phoneNumber) {
    const clean = phoneNumber.replace(/\D/g, '');
    appUrl = `whatsapp://send?phone=${clean}&text=${encoded}`;
    webUrl = `https://web.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  } else {
    appUrl = `whatsapp://send?text=${encoded}`;
    webUrl = `https://web.whatsapp.com/send?text=${encoded}`;
  }

  if (isMobile) {
    // ✅ على الموبايل: افتح تطبيق واتساب مباشرة بدون مرور على api.whatsapp.com
    const anchor = document.createElement('a');
    anchor.href = appUrl;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // fallback: لو ما فتح التطبيق خلال ثانيتين، افتح واتساب ويب
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 2000);
  } else {
    // ✅ على الديسك توب: افتح web.whatsapp.com مباشرة (بدون api.whatsapp.com)
    window.open(webUrl, '_blank');
  }
}

// ── Single Bill Share ────────────────────────────────────────
export interface SingleBillShareData {
  groupName: string;
  groupEmoji: string;
  billTitle: string;
  totalAmount: number;
  paidByName: string;
  splits: { name: string; amount: number; paid: boolean }[];
  currency?: string;
}

export function buildSingleBillMessage(data: SingleBillShareData): string {
  const currency = data.currency || 'ر.س';
  const totalPeople = data.splits.length;
  const perPerson = r1(data.totalAmount / totalPeople);
  const lines: string[] = [];

  lines.push(`💰 *فاتورة - ${data.billTitle}*`);
  lines.push(`${data.groupEmoji} *${data.groupName}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`\n💵 الإجمالي: *${r1(data.totalAmount).toFixed(1)} ${currency}*`);
  lines.push(`👥 عدد الأشخاص: ${totalPeople}`);
  lines.push(`💳 دفعها: ${data.paidByName}`);
  lines.push(`📊 نصيب كل شخص: *${perPerson.toFixed(1)} ${currency}*`);

  lines.push(`\n📋 *تفاصيل التقسيم:*`);
  data.splits.forEach((s) => {
    const status = s.paid ? '✅' : '⏳';
    lines.push(`  ${status} ${s.name}: ${s.amount.toFixed(1)} ${currency}`);
  });

  const unpaidCount = data.splits.filter((s) => !s.paid).length;
  if (unpaidCount > 0) {
    lines.push(`\n⚠️ *${unpaidCount} شخص لم يدفع بعد*`);
  } else {
    lines.push(`\n✅ *تمت التسوية الكاملة!*`);
  }

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📲 تم الإرسال من تطبيق *قسّمها* 💜`);

  return lines.join('\n');
}
