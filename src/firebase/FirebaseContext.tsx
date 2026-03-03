// ============================================================
// 🔥 Firebase Context - ربط Firebase بالتطبيق
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FirebaseUser, onAuthChange, signInWithGoogle, signOutUser, handleRedirectResult } from './authService';
import {
  fetchBills,
  fetchGroups,
  fetchFriends,
  addBill,
  updateBill,
  deleteBill,
  addGroup,
  updateGroup,
  deleteGroup,
  addFriend,
  deleteFriend,
  saveUserProfile,
  subscribeToBills,
  subscribeToGroups,
} from './billsService';
import { Bill, Group, User } from '../types';

// ============================================================
// Types
// ============================================================
interface FirebaseContextType {
  // حالة المصادقة
  firebaseUser: FirebaseUser | null;
  isFirebaseReady: boolean;
  isFirebaseLoading: boolean;
  firebaseError: string | null;
  isFirebaseConnected: boolean;

  // البيانات
  firebaseBills: Bill[];
  firebaseGroups: Group[];
  firebaseFriends: User[];

  // عمليات المصادقة
  loginWithGoogle: () => Promise<void>;
  logoutFromFirebase: () => Promise<void>;

  // عمليات الفواتير
  fbAddBill: (bill: Omit<Bill, 'id'>) => Promise<string | null>;
  fbUpdateBill: (billId: string, updates: Partial<Bill>) => Promise<boolean>;
  fbDeleteBill: (billId: string) => Promise<boolean>;

  // عمليات المجموعات
  fbAddGroup: (group: Omit<Group, 'id'>) => Promise<string | null>;
  fbUpdateGroup: (groupId: string, updates: Partial<Group>) => Promise<boolean>;
  fbDeleteGroup: (groupId: string) => Promise<boolean>;

  // عمليات الأصدقاء
  fbAddFriend: (friend: Omit<User, 'id'>) => Promise<string | null>;
  fbDeleteFriend: (friendId: string) => Promise<boolean>;

  // مزامنة يدوية
  syncData: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
};

// ============================================================
// Provider
// ============================================================
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  const [firebaseBills, setFirebaseBills] = useState<Bill[]>([]);
  const [firebaseGroups, setFirebaseGroups] = useState<Group[]>([]);
  const [firebaseFriends, setFirebaseFriends] = useState<User[]>([]);

  // ============================================================
  // مراقبة حالة المصادقة
  // ============================================================
  useEffect(() => {
    // معالجة Redirect للموبايل
    handleRedirectResult().then(user => {
      if (user) setFirebaseUser(user);
    });

    // مراقبة تغييرات المصادقة
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      setIsFirebaseReady(true);

      if (user) {
        setIsFirebaseConnected(true);
        await syncUserData(user.uid);
      } else {
        setIsFirebaseConnected(false);
        setFirebaseBills([]);
        setFirebaseGroups([]);
        setFirebaseFriends([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // مزامنة في الوقت الفعلي عند تسجيل الدخول
  // ============================================================
  useEffect(() => {
    if (!firebaseUser) return;

    const uid = firebaseUser.uid;

    // مزامنة الفواتير في الوقت الفعلي
    const unsubBills = subscribeToBills(uid, (bills) => {
      setFirebaseBills(bills);
    });

    // مزامنة المجموعات في الوقت الفعلي
    const unsubGroups = subscribeToGroups(uid, (groups) => {
      setFirebaseGroups(groups);
    });

    return () => {
      unsubBills();
      unsubGroups();
    };
  }, [firebaseUser]);

  // ============================================================
  // جلب البيانات
  // ============================================================
  const syncUserData = async (uid: string) => {
    try {
      const [bills, groups, friends] = await Promise.all([
        fetchBills(uid),
        fetchGroups(uid),
        fetchFriends(uid),
      ]);
      setFirebaseBills(bills);
      setFirebaseGroups(groups);
      setFirebaseFriends(friends);
      console.log('✅ تمت المزامنة - فواتير:', bills.length, 'مجموعات:', groups.length);
    } catch (error) {
      console.error('❌ خطأ في المزامنة:', error);
    }
  };

  const syncData = useCallback(async () => {
    if (firebaseUser) await syncUserData(firebaseUser.uid);
  }, [firebaseUser]);

  // ============================================================
  // تسجيل الدخول بـ Google
  // ============================================================
  const loginWithGoogle = async () => {
    setIsFirebaseLoading(true);
    setFirebaseError(null);
    try {
      const result = await signInWithGoogle();
      if (!result.success && result.error) {
        setFirebaseError(result.error);
      } else if (result.success && result.user) {
        setFirebaseUser(result.user);
        // حفظ الاسم في localStorage للتطبيق
        localStorage.setItem('qassimha_user_name', result.user.displayName || 'مستخدم');
        await saveUserProfile(result.user.uid, {
          displayName: result.user.displayName || 'مستخدم',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
        });
      }
    } catch {
      setFirebaseError('حدث خطأ غير متوقع');
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  // ============================================================
  // تسجيل الخروج
  // ============================================================
  const logoutFromFirebase = async () => {
    await signOutUser();
    setFirebaseUser(null);
    setFirebaseBills([]);
    setFirebaseGroups([]);
    setFirebaseFriends([]);
    setIsFirebaseConnected(false);
  };

  // ============================================================
  // عمليات الفواتير
  // ============================================================
  const fbAddBill = async (bill: Omit<Bill, 'id'>): Promise<string | null> => {
    if (!firebaseUser) return null;
    return await addBill(firebaseUser.uid, bill);
  };

  const fbUpdateBill = async (billId: string, updates: Partial<Bill>): Promise<boolean> => {
    if (!firebaseUser) return false;
    return await updateBill(firebaseUser.uid, billId, updates);
  };

  const fbDeleteBill = async (billId: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    return await deleteBill(firebaseUser.uid, billId);
  };

  // ============================================================
  // عمليات المجموعات
  // ============================================================
  const fbAddGroup = async (group: Omit<Group, 'id'>): Promise<string | null> => {
    if (!firebaseUser) return null;
    return await addGroup(firebaseUser.uid, group);
  };

  const fbUpdateGroup = async (groupId: string, updates: Partial<Group>): Promise<boolean> => {
    if (!firebaseUser) return false;
    return await updateGroup(firebaseUser.uid, groupId, updates);
  };

  const fbDeleteGroup = async (groupId: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    return await deleteGroup(firebaseUser.uid, groupId);
  };

  // ============================================================
  // عمليات الأصدقاء
  // ============================================================
  const fbAddFriend = async (friend: Omit<User, 'id'>): Promise<string | null> => {
    if (!firebaseUser) return null;
    return await addFriend(firebaseUser.uid, friend);
  };

  const fbDeleteFriend = async (friendId: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    return await deleteFriend(firebaseUser.uid, friendId);
  };

  return (
    <FirebaseContext.Provider value={{
      firebaseUser,
      isFirebaseReady,
      isFirebaseLoading,
      firebaseError,
      isFirebaseConnected,
      firebaseBills,
      firebaseGroups,
      firebaseFriends,
      loginWithGoogle,
      logoutFromFirebase,
      fbAddBill,
      fbUpdateBill,
      fbDeleteBill,
      fbAddGroup,
      fbUpdateGroup,
      fbDeleteGroup,
      fbAddFriend,
      fbDeleteFriend,
      syncData,
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};
