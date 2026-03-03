import { User, Group, Bill, Settlement } from '@/types';

const savedUserName = localStorage.getItem('qassimha_user_name') || 'أنت';

export const currentUser: User = {
  id: 'user-1',
  name: savedUserName,
  avatar: '👨‍💻',
  phone: '',
};

export const sampleUsers: User[] = [
  currentUser,
  { id: 'user-2', name: 'خالد العلي', avatar: '👨‍🎨', phone: '+966 55 234 5678' },
  { id: 'user-3', name: 'سارة أحمد', avatar: '👩‍💼', phone: '+966 54 345 6789' },
  { id: 'user-4', name: 'فهد السالم', avatar: '🧑‍🔬', phone: '+966 56 456 7890' },
  { id: 'user-5', name: 'نورة محمد', avatar: '👩‍🎓', phone: '+966 50 567 8901' },
  { id: 'user-6', name: 'عبدالله حسن', avatar: '👨‍🏫', phone: '+966 55 678 9012' },
];

export const sampleGroups: Group[] = [
  {
    id: 'group-1',
    name: 'رحلة الشتاء',
    emoji: '🏔️',
    createdBy: 'user-1',
    members: [
      { userId: 'user-1', role: 'admin', joinedAt: '2024-01-15' },
      { userId: 'user-2', role: 'member', joinedAt: '2024-01-15' },
      { userId: 'user-3', role: 'member', joinedAt: '2024-01-16' },
      { userId: 'user-4', role: 'member', joinedAt: '2024-01-16' },
    ],
    createdAt: '2024-01-15',
  },
  {
    id: 'group-2',
    name: 'غداء العمل',
    emoji: '🍔',
    createdBy: 'user-1',
    members: [
      { userId: 'user-1', role: 'admin', joinedAt: '2024-02-01' },
      { userId: 'user-2', role: 'member', joinedAt: '2024-02-01' },
      { userId: 'user-5', role: 'member', joinedAt: '2024-02-02' },
    ],
    createdAt: '2024-02-01',
  },
  {
    id: 'group-3',
    name: 'شقة السكن',
    emoji: '🏠',
    createdBy: 'user-1',
    members: [
      { userId: 'user-1', role: 'admin', joinedAt: '2024-01-01' },
      { userId: 'user-4', role: 'member', joinedAt: '2024-01-01' },
      { userId: 'user-6', role: 'member', joinedAt: '2024-01-01' },
    ],
    createdAt: '2024-01-01',
  },
];

export const sampleBills: Bill[] = [
  {
    id: 'bill-1',
    groupId: 'group-1',
    title: 'حجز الفندق',
    description: 'فندق 3 ليالي',
    totalAmount: 2400,
    currency: 'SAR',
    paidBy: 'user-1',
    splitType: 'equal',
    splits: [
      { userId: 'user-1', amount: 600, paid: true, paidAt: '2024-01-15' },
      { userId: 'user-2', amount: 600, paid: true, paidAt: '2024-01-20' },
      { userId: 'user-3', amount: 600, paid: false },
      { userId: 'user-4', amount: 600, paid: false },
    ],
    createdAt: '2024-01-15',
    category: 'travel',
  },
  {
    id: 'bill-2',
    groupId: 'group-1',
    title: 'عشاء المطعم',
    description: 'مطعم البيك',
    totalAmount: 320,
    currency: 'SAR',
    paidBy: 'user-2',
    splitType: 'equal',
    splits: [
      { userId: 'user-1', amount: 80, paid: false },
      { userId: 'user-2', amount: 80, paid: true, paidAt: '2024-01-16' },
      { userId: 'user-3', amount: 80, paid: true, paidAt: '2024-01-18' },
      { userId: 'user-4', amount: 80, paid: false },
    ],
    createdAt: '2024-01-16',
    category: 'food',
  },
  {
    id: 'bill-3',
    groupId: 'group-2',
    title: 'غداء الفريق',
    description: 'بيتزا هت',
    totalAmount: 180,
    currency: 'SAR',
    paidBy: 'user-1',
    splitType: 'equal',
    splits: [
      { userId: 'user-1', amount: 60, paid: true, paidAt: '2024-02-01' },
      { userId: 'user-2', amount: 60, paid: false },
      { userId: 'user-5', amount: 60, paid: false },
    ],
    createdAt: '2024-02-01',
    category: 'food',
  },
  {
    id: 'bill-4',
    groupId: 'group-3',
    title: 'إيجار شهر فبراير',
    totalAmount: 6000,
    currency: 'SAR',
    paidBy: 'user-1',
    splitType: 'equal',
    splits: [
      { userId: 'user-1', amount: 2000, paid: true, paidAt: '2024-02-01' },
      { userId: 'user-4', amount: 2000, paid: true, paidAt: '2024-02-03' },
      { userId: 'user-6', amount: 2000, paid: false },
    ],
    createdAt: '2024-02-01',
    category: 'rent',
  },
  {
    id: 'bill-5',
    groupId: 'group-3',
    title: 'فاتورة الكهرباء',
    totalAmount: 450,
    currency: 'SAR',
    paidBy: 'user-6',
    splitType: 'equal',
    splits: [
      { userId: 'user-1', amount: 150, paid: false },
      { userId: 'user-4', amount: 150, paid: false },
      { userId: 'user-6', amount: 150, paid: true, paidAt: '2024-02-05' },
    ],
    createdAt: '2024-02-05',
    category: 'utilities',
  },
];

export const sampleSettlements: Settlement[] = [
  {
    id: 'settle-1',
    groupId: 'group-1',
    fromUserId: 'user-2',
    toUserId: 'user-1',
    amount: 600,
    settled: true,
    settledAt: '2024-01-20',
    createdAt: '2024-01-15',
  },
];
