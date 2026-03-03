// ============================================
// Validation Utilities - التحقق من صحة البيانات
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ── التحقق من المبلغ
export function validateAmount(value: string | number): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: '⚠️ يرجى إدخال المبلغ' };
  }

  if (isNaN(num)) {
    return { valid: false, error: '⚠️ المبلغ يجب أن يكون رقماً صحيحاً' };
  }

  if (num < 0) {
    return { valid: false, error: '⛔ لا يمكن إدخال مبلغ سالب' };
  }

  if (num === 0) {
    return { valid: false, error: '⚠️ المبلغ يجب أن يكون أكبر من صفر' };
  }

  if (num > 1_000_000) {
    return { valid: false, error: '⚠️ المبلغ كبير جداً (الحد الأقصى 1,000,000)' };
  }

  if (!isFinite(num)) {
    return { valid: false, error: '⚠️ المبلغ غير صالح' };
  }

  return { valid: true };
}

// ── التحقق من القسمة على صفر
export function validateDivision(amount: number, participants: number): ValidationResult {
  if (participants <= 0) {
    return { valid: false, error: '⛔ لا يمكن القسمة على صفر — اختر شخصاً واحداً على الأقل' };
  }

  if (amount <= 0) {
    return { valid: false, error: '⚠️ المبلغ يجب أن يكون أكبر من صفر' };
  }

  return { valid: true };
}

// ── التحقق من نسبة الضريبة أو الخدمة
export function validateRate(value: string | number, label: string = 'النسبة'): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (value === '' || value === null || value === undefined) {
    return { valid: true }; // النسبة اختيارية
  }

  if (isNaN(num)) {
    return { valid: false, error: `⚠️ ${label} يجب أن تكون رقماً` };
  }

  if (num < 0) {
    return { valid: false, error: `⛔ ${label} لا يمكن أن تكون سالبة` };
  }

  if (num > 100) {
    return { valid: false, error: `⚠️ ${label} لا يمكن أن تتجاوز 100%` };
  }

  return { valid: true };
}

// ── التحقق من اسم الفاتورة
export function validateTitle(title: string): ValidationResult {
  if (!title || !title.trim()) {
    return { valid: false, error: '⚠️ يرجى إدخال اسم الفاتورة' };
  }

  if (title.trim().length < 2) {
    return { valid: false, error: '⚠️ اسم الفاتورة قصير جداً (حرفان على الأقل)' };
  }

  if (title.trim().length > 100) {
    return { valid: false, error: '⚠️ اسم الفاتورة طويل جداً (100 حرف كحد أقصى)' };
  }

  return { valid: true };
}

// ── حساب آمن للقسمة (يمنع القسمة على صفر)
export function safeDivide(amount: number, count: number): number {
  if (count <= 0) return 0;
  if (amount <= 0) return 0;
  return Math.round((amount / count) * 10) / 10;
}

// ── التحقق من صحة فاتورة كاملة
export interface BillValidation {
  titleError?: string;
  amountError?: string;
  participantsError?: string;
  taxError?: string;
  tipError?: string;
  isValid: boolean;
}

export function validateBill(data: {
  title: string;
  amount: string | number;
  participants: number;
  taxRate?: string | number;
  tipRate?: string | number;
}): BillValidation {
  const result: BillValidation = { isValid: true };

  const titleCheck = validateTitle(data.title);
  if (!titleCheck.valid) {
    result.titleError = titleCheck.error;
    result.isValid = false;
  }

  const amountCheck = validateAmount(data.amount);
  if (!amountCheck.valid) {
    result.amountError = amountCheck.error;
    result.isValid = false;
  }

  const divisionCheck = validateDivision(
    typeof data.amount === 'string' ? parseFloat(data.amount) || 0 : data.amount,
    data.participants
  );
  if (!divisionCheck.valid) {
    result.participantsError = divisionCheck.error;
    result.isValid = false;
  }

  if (data.taxRate !== undefined && data.taxRate !== '') {
    const taxCheck = validateRate(data.taxRate, 'نسبة الضريبة');
    if (!taxCheck.valid) {
      result.taxError = taxCheck.error;
      result.isValid = false;
    }
  }

  if (data.tipRate !== undefined && data.tipRate !== '') {
    const tipCheck = validateRate(data.tipRate, 'نسبة الخدمة');
    if (!tipCheck.valid) {
      result.tipError = tipCheck.error;
      result.isValid = false;
    }
  }

  return result;
}
