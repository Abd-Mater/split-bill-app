import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, Group, Bill, Settlement, Screen, BillCategory } from '@/types';
import {
  currentUser as defaultUser,
  sampleUsers,
  sampleGroups,
  sampleBills,
  sampleSettlements,
} from '@/data/sampleData';
import { useLocalStorage, STORAGE_KEYS } from '@/hooks/useLocalStorage';
import { addGroup as addGroupToFirebase } from '../firebase/billsService';
import { auth } from '../firebase/config'; // لنحصل على UID الحقيقي
import { addGroup as addGroupToFirebase, addBill as addBillToFirebase } from '../firebase/billsService';

interface AppState {
  currentUser: User;
  users: User[];
  groups: Group[];
  bills: Bill[];
  settlements: Settlement[];
  currentScreen: Screen;
  selectedGroupId: string | null;
  selectedBillId: string | null;
  friends: string[];
}

interface AppContextType extends AppState {
  navigate: (screen: Screen) => void;
  selectGroup: (groupId: string) => void;
  selectBill: (billId: string) => void;
  createGroup: (name: string, emoji: string, memberIds: string[]) => void;
  addBill: (
    groupId: string,
    title: string,
    amount: number,
    category: BillCategory,
    splitType: 'equal' | 'custom',
    paidBy: string,
    description?: string
  ) => void;
  addBillCustom: (
    groupId: string,
    title: string,
    amount: number,
    category: BillCategory,
    splitType: 'equal' | 'custom',
    paidBy: string,
    customSplits: Record<string, number>,
    description?: string
  ) => void;
  updateBill: (billId: string, updates: Partial<Bill>) => void;
  deleteBill: (billId: string) => void;
  updateGroup: (groupId: string, updates: { name?: string; emoji?: string }) => void;
  deleteGroup: (groupId: string) => void;
  togglePayment: (billId: string, userId: string) => void;
  addFriend: (name: string, phone: string) => void;
  removeFriend: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
  getGroupBills: (groupId: string) => Bill[];
  getGroupBalance: (groupId: string) => { userId: string; balance: number }[];
  getTotalOwed: () => number;
  getTotalOwing: () => number;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // ── أولاً: نقرأ الاسم الحقيقي من localStorage - يُحدَّث عند كل render ─────
  const realName = localStorage.getItem('qassimha_user_name') || 'أنت';

  // ── مسح بيانات المستخدم القديمة إذا كانت تحتوي على اسم "أحمد محمد" ─────
  const savedUserRaw = localStorage.getItem('qassimha_current_user');
  if (savedUserRaw) {
    try {
      const saved = JSON.parse(savedUserRaw);
      if (saved.name !== realName) {
        localStorage.removeItem('qassimha_current_user');
        localStorage.removeItem('qassimha_users');
      }
    } catch { localStorage.removeItem('qassimha_current_user'); }
  }

  // ── كل البيانات محفوظة في localStorage تلقائياً ──────────────
  const [groups,      setGroups     ] = useLocalStorage<Group[]>     (STORAGE_KEYS.GROUPS,       sampleGroups);
  const [bills,       setBills      ] = useLocalStorage<Bill[]>       (STORAGE_KEYS.BILLS,        sampleBills);
  const [_users,      setUsers      ] = useLocalStorage<User[]>       (STORAGE_KEYS.USERS,        sampleUsers);
  const [friends,     setFriends    ] = useLocalStorage<string[]>     (STORAGE_KEYS.FRIENDS,      ['user-2', 'user-3', 'user-4', 'user-5', 'user-6']);
  const [settlements, setSettlements] = useLocalStorage<Settlement[]> (STORAGE_KEYS.SETTLEMENTS,  sampleSettlements);
  const [_currentUser, setCurrentUser] = useLocalStorage<User>        (STORAGE_KEYS.CURRENT_USER, { ...defaultUser, name: realName });

  // ── دائماً نفرض الاسم الحقيقي على user-1 ─────────────────────
  const users: User[] = _users.map(u => u.id === 'user-1' ? { ...u, name: realName } : u);
  const currentUser: User = { ..._currentUser, name: realName };

  // ── حالة التنقل (لا تحتاج حفظ دائم) ─────────────────────────
  const [currentScreen,    setCurrentScreen   ] = useState<Screen>('home');
  const [selectedGroupId,  setSelectedGroupId ] = useState<string | null>(null);
  const [selectedBillId,   setSelectedBillId  ] = useState<string | null>(null);

  // ── التنقل بين الشاشات ────────────────────────────────────────
  const navigate = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const selectGroup = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentScreen('group-detail');
  }, []);

  const selectBill = useCallback((billId: string) => {
    setSelectedBillId(billId);
    setCurrentScreen('bill-detail');
  }, []);

  // ── إنشاء مجموعة جديدة (تُحفظ فوراً) ───────────────────────
const createGroup = useCallback(async (name: string, emoji: string, memberIds: string[]) => {
  // 1. الحصول على الـ UID الحقيقي من الفايربيز (وليس من LocalStorage)
  const currentUserId = auth.currentUser?.uid;
  
  if (!currentUserId) {
    alert("عفواً، يجب تسجيل الدخول أولاً!");
    return;
  }

  const newGroup: Group = {
    id: uuidv4(), // سنستبدله لاحقاً بـ Key الفايربيز
    name,
    emoji,
    createdBy: currentUserId,
    members: [
      { userId: currentUserId, role: 'admin', joinedAt: new Date().toISOString() },
      ...memberIds.map((id) => ({
        userId: id,
        role: 'member' as const,
        joinedAt: new Date().toISOString(),
      })),
    ],
    createdAt: new Date().toISOString(),
  };

  try {
    // 🔥 الخطوة السحرية: إرسال للفايربيز
    const firebaseId = await addGroupToFirebase(currentUserId, newGroup);
    
    if (firebaseId) {
      // نحدث الحالة المحلية باستخدام المعرف الذي جاء من الفايربيز
      const groupWithId = { ...newGroup, id: firebaseId };
      setGroups((prev) => [groupWithId, ...prev]);
      setSelectedGroupId(firebaseId);
      setCurrentScreen('group-detail');
    }
  } catch (error) {
    console.error("❌ فشل الحفظ في فايربيز:", error);
  }
}, [setGroups, setCurrentScreen]);

  // ── إضافة فاتورة بتقسيم مخصص (تُحفظ فوراً) ─────────────────
const addBillCustom = useCallback(
  async (
    groupId: string,
    title: string,
    amount: number,
    category: BillCategory,
    splitType: 'equal' | 'custom',
    paidBy: string,
    customSplits: Record<string, number>,
    description?: string
  ) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const newBill: Omit<Bill, 'id'> = {
      groupId,
      title,
      description,
      totalAmount: amount,
      currency: 'SAR',
      paidBy,
      splitType,
      splits: group.members.map((m) => ({
        userId: m.userId,
        // هنا نستخدم القيمة المخصصة من الـ Record، ولو مش موجودة نحط 0
        amount: customSplits[m.userId] ?? 0,
        paid: m.userId === paidBy,
        paidAt: m.userId === paidBy ? new Date().toISOString() : undefined,
      })),
      createdAt: new Date().toISOString(),
      category,
    };

    // 🔥 الرفع للفايربيز
    const billId = await addBillToFirebase(currentUserId, newBill);
    
    if (billId) {
      setBills((prev) => [{ ...newBill, id: billId }, ...prev]);
      setCurrentScreen('group-detail');
    }
  },
  [groups, setBills, setCurrentScreen]
);

  // ── إضافة فاتورة (تُحفظ فوراً) ──────────────────────────────
const addBill = useCallback(
  async (
    groupId: string,
    title: string,
    amount: number,
    category: BillCategory,
    splitType: 'equal' | 'custom',
    paidBy: string,
    description?: string
  ) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const splitAmount = amount / group.members.length;
    const newBill: Omit<Bill, 'id'> = {
      groupId,
      title,
      description,
      totalAmount: amount,
      currency: 'SAR',
      paidBy,
      splitType,
      splits: group.members.map((m) => ({
        userId: m.userId,
        amount: Math.round(splitAmount * 100) / 100,
        paid: m.userId === paidBy,
        paidAt: m.userId === paidBy ? new Date().toISOString() : undefined,
      })),
      createdAt: new Date().toISOString(),
      category,
    };

    // 🔥 الحفظ في فايربيز
    const billId = await addBillToFirebase(currentUserId, newBill);
    
    if (billId) {
      setBills((prev) => [{ ...newBill, id: billId }, ...prev]);
      setCurrentScreen('group-detail');
    }
  },
  [groups, setBills, setCurrentScreen]
);

  // ── تحديث فاتورة (تُحفظ فوراً) ──────────────────────────────
  const updateBill = useCallback((billId: string, updates: Partial<Bill>) => {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== billId) return bill;
        
        let newSplits = bill.splits;
        
        // إذا تغير المبلغ، نعيد الحساب بالتساوي (للتبسيط حالياً)
        if (updates.totalAmount && updates.totalAmount !== bill.totalAmount) {
           const count = bill.splits.length;
           const perPerson = updates.totalAmount / count;
           newSplits = bill.splits.map(s => ({
             ...s,
             amount: Math.round(perPerson * 100) / 100
           }));
        }

        // إذا تغير الدافع، نحدث حالة الدفع له
        if (updates.paidBy && updates.paidBy !== bill.paidBy) {
           newSplits = newSplits.map(s => ({
             ...s,
             paid: s.userId === updates.paidBy,
             paidAt: s.userId === updates.paidBy ? new Date().toISOString() : undefined
           }));
        }

        return { ...bill, ...updates, splits: newSplits };
      })
    );
  }, [setBills]);

  // ── حذف فاتورة (تُحفظ فوراً) ────────────────────────────────
  const deleteBill = useCallback((billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
  }, [setBills]);

  // ── تحديث مجموعة (تُحفظ فوراً) ──────────────────────────────
  const updateGroup = useCallback((groupId: string, updates: { name?: string; emoji?: string }) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  }, [setGroups]);

  // ── حذف مجموعة وكل فواتيرها (تُحفظ فوراً) ───────────────────
  const deleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setBills((prev) => prev.filter((b) => b.groupId !== groupId));
    setSettlements((prev) => prev.filter((s) => s.groupId !== groupId));
  }, [setGroups, setBills, setSettlements]);

  // ── تبديل حالة الدفع (تُحفظ فوراً) ─────────────────────────
  const togglePayment = useCallback((billId: string, userId: string) => {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== billId) return bill;
        return {
          ...bill,
          splits: bill.splits.map((split) => {
            if (split.userId !== userId) return split;
            return {
              ...split,
              paid: !split.paid,
              paidAt: !split.paid ? new Date().toISOString() : undefined,
            };
          }),
        };
      })
    );
  }, [setBills]);

  // ── إضافة صديق (يُحفظ فوراً) ────────────────────────────────
  const addFriend = useCallback((name: string, phone: string) => {
    const newUser: User = {
      id: uuidv4(),
      name,
      avatar: ['👨', '👩', '🧑', '👦', '👧'][Math.floor(Math.random() * 5)],
      phone,
    };
    setUsers((prev) => [...prev, newUser]);
    setFriends((prev) => [...prev, newUser.id]);
    setCurrentScreen('friends');
  }, [setUsers, setFriends]);

  // ── حذف صديق (يُحفظ فوراً) ──────────────────────────────────
  const removeFriend = useCallback((userId: string) => {
    setFriends((prev) => prev.filter((id) => id !== userId));
  }, [setFriends]);

  // ── مسح جميع البيانات ─────────────────────────────────────────
  const clearAllData = useCallback(() => {
    setGroups(sampleGroups);
    setBills(sampleBills);
    setUsers(sampleUsers);
    setFriends(['user-2', 'user-3', 'user-4', 'user-5', 'user-6']);
    setSettlements(sampleSettlements);
    setCurrentUser(defaultUser);
    setCurrentScreen('home');
    setSelectedGroupId(null);
    setSelectedBillId(null);
  }, [setGroups, setBills, setUsers, setFriends, setSettlements, setCurrentUser]);

  // ── Helper: البحث عن مستخدم ──────────────────────────────────
  const getUserById = useCallback(
    (userId: string) => users.find((u) => u.id === userId),
    [users]
  );

  // ── Helper: فواتير المجموعة ───────────────────────────────────
  const getGroupBills = useCallback(
    (groupId: string) => bills.filter((b) => b.groupId === groupId),
    [bills]
  );

  // ── Helper: أرصدة المجموعة ────────────────────────────────────
  const getGroupBalance = useCallback(
    (groupId: string) => {
      const groupBills = bills.filter((b) => b.groupId === groupId);
      const group = groups.find((g) => g.id === groupId);
      if (!group) return [];

      const balances: Record<string, number> = {};
      group.members.forEach((m) => { balances[m.userId] = 0; });

      groupBills.forEach((bill) => {
        bill.splits.forEach((split) => {
          if (!split.paid && split.userId !== bill.paidBy) {
            balances[split.userId] = (balances[split.userId] || 0) - split.amount;
            balances[bill.paidBy] = (balances[bill.paidBy] || 0) + split.amount;
          }
        });
      });

      return Object.entries(balances).map(([userId, balance]) => ({ userId, balance }));
    },
    [bills, groups]
  );

  // ── Helper: الإجمالي المستحق لي ───────────────────────────────
  const getTotalOwed = useCallback(() => {
    let total = 0;
    bills.forEach((bill) => {
      if (bill.paidBy === currentUser.id) {
        bill.splits.forEach((split) => {
          if (!split.paid && split.userId !== currentUser.id) {
            total += split.amount;
          }
        });
      }
    });
    return total;
  }, [bills, currentUser.id]);

  // ── Helper: الإجمالي الذي عليّ ───────────────────────────────
  const getTotalOwing = useCallback(() => {
    let total = 0;
    bills.forEach((bill) => {
      if (bill.paidBy !== currentUser.id) {
        bill.splits.forEach((split) => {
          if (!split.paid && split.userId === currentUser.id) {
            total += split.amount;
          }
        });
      }
    });
    return total;
  }, [bills, currentUser.id]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        groups,
        bills,
        settlements,
        currentScreen,
        selectedGroupId,
        selectedBillId,
        friends,
        navigate,
        selectGroup,
        selectBill,
        createGroup,
        addBill,
        addBillCustom,
        updateBill,
        deleteBill,
        updateGroup,
        deleteGroup,
        togglePayment,
        addFriend,
        removeFriend,
        getUserById,
        getGroupBills,
        getGroupBalance,
        getTotalOwed,
        getTotalOwing,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
