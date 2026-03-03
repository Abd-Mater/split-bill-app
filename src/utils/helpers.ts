import { BillCategory } from '@/types';

export const categoryConfig: Record<BillCategory, { emoji: string; label: string; color: string }> = {
  food: { emoji: '🍕', label: 'طعام', color: 'bg-orange-100 text-orange-700' },
  transport: { emoji: '🚗', label: 'مواصلات', color: 'bg-blue-100 text-blue-700' },
  shopping: { emoji: '🛍️', label: 'تسوق', color: 'bg-pink-100 text-pink-700' },
  entertainment: { emoji: '🎬', label: 'ترفيه', color: 'bg-purple-100 text-purple-700' },
  rent: { emoji: '🏠', label: 'إيجار', color: 'bg-green-100 text-green-700' },
  utilities: { emoji: '💡', label: 'خدمات', color: 'bg-yellow-100 text-yellow-700' },
  travel: { emoji: '✈️', label: 'سفر', color: 'bg-indigo-100 text-indigo-700' },
  other: { emoji: '📦', label: 'أخرى', color: 'bg-gray-100 text-gray-700' },
};

export const groupEmojis = ['🏔️', '🍔', '🏠', '✈️', '🎮', '⚽', '🎓', '💼', '🎉', '🏖️', '🚗', '🍕'];

export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  return `${amount.toFixed(0)} ${currency === 'SAR' ? 'ر.س' : currency}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}
