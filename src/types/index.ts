export interface User {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
}

export interface BillSplit {
  userId: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

export interface Bill {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  paidBy: string;
  splitType: 'equal' | 'custom' | 'percentage';
  splits: BillSplit[];
  createdAt: string;
  category: BillCategory;
}

export type BillCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'rent'
  | 'utilities'
  | 'travel'
  | 'other';

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  settled: boolean;
  settledAt?: string;
  createdAt: string;
}

export type Screen =
  | 'home'
  | 'groups'
  | 'group-detail'
  | 'create-group'
  | 'add-bill'
  | 'multi-bill'
  | 'bill-calculator'
  | 'bill-detail'
  | 'friends'
  | 'add-friend'
  | 'activity'
  | 'notifications'
  | 'profile'
  | 'settlements'
  | 'reports';
