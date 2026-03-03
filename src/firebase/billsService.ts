// ============================================================
// 🔥 Firebase Realtime Database - Bills Service
// ============================================================
// المسار: users/${uid}/bills/${billId}
// ============================================================

import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  off,
  DatabaseReference,
  Unsubscribe,
} from 'firebase/database';
import { database } from './config';
import { Bill, Group, User } from '../types';

// ============================================================
// 📌 مسارات قاعدة البيانات
// ============================================================
const paths = {
  userBills:   (uid: string) => `users/${uid}/bills`,
  bill:        (uid: string, billId: string) => `users/${uid}/bills/${billId}`,
  userGroups:  (uid: string) => `users/${uid}/groups`,
  group:       (uid: string, groupId: string) => `users/${uid}/groups/${groupId}`,
  userProfile: (uid: string) => `users/${uid}/profile`,
  userFriends: (uid: string) => `users/${uid}/friends`,
};

// ============================================================
// 🧾 BILLS - عمليات الفواتير
// ============================================================

// ✅ جلب كل الفواتير لمستخدم معين
export const fetchBills = async (uid: string): Promise<Bill[]> => {
  try {
    const billsRef = ref(database, paths.userBills(uid));
    const snapshot = await get(billsRef);

    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      ...data[key],
      id: key,
    })) as Bill[];
  } catch (error) {
    console.error('❌ خطأ في جلب الفواتير:', error);
    return [];
  }
};

// ✅ إضافة فاتورة جديدة
export const addBill = async (uid: string, bill: Omit<Bill, 'id'>): Promise<string | null> => {
  try {
    const billsRef = ref(database, paths.userBills(uid));
    const newBillRef: DatabaseReference = push(billsRef);

    await set(newBillRef, {
      ...bill,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ تم إضافة الفاتورة:', newBillRef.key);
    return newBillRef.key;
  } catch (error) {
    console.error('❌ خطأ في إضافة الفاتورة:', error);
    return null;
  }
};

// ✅ تحديث فاتورة موجودة
export const updateBill = async (
  uid: string,
  billId: string,
  updates: Partial<Bill>
): Promise<boolean> => {
  try {
    const billRef = ref(database, paths.bill(uid, billId));
    await update(billRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ تم تحديث الفاتورة:', billId);
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث الفاتورة:', error);
    return false;
  }
};

// ✅ حذف فاتورة
export const deleteBill = async (uid: string, billId: string): Promise<boolean> => {
  try {
    const billRef = ref(database, paths.bill(uid, billId));
    await remove(billRef);

    console.log('✅ تم حذف الفاتورة:', billId);
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف الفاتورة:', error);
    return false;
  }
};

// ✅ مزامنة الفواتير في الوقت الفعلي (Real-time listener)
export const subscribeToBills = (
  uid: string,
  callback: (bills: Bill[]) => void
): Unsubscribe => {
  const billsRef = ref(database, paths.userBills(uid));

  const listener = onValue(
    billsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const bills = Object.keys(data).map(key => ({
        ...data[key],
        id: key,
      })) as Bill[];
      callback(bills);
    },
    (error) => {
      console.error('❌ خطأ في مزامنة الفواتير:', error);
      callback([]);
    }
  );

  // إرجاع دالة إلغاء الاشتراك
  return () => off(billsRef, 'value', listener);
};

// ============================================================
// 🏘️ GROUPS - عمليات المجموعات
// ============================================================

// ✅ جلب كل المجموعات
export const fetchGroups = async (uid: string): Promise<Group[]> => {
  try {
    const groupsRef = ref(database, paths.userGroups(uid));
    const snapshot = await get(groupsRef);

    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      ...data[key],
      id: key,
    })) as Group[];
  } catch (error) {
    console.error('❌ خطأ في جلب المجموعات:', error);
    return [];
  }
};

// ✅ إضافة مجموعة جديدة
export const addGroup = async (uid: string, group: Omit<Group, 'id'>): Promise<string | null> => {
  try {
    const groupsRef = ref(database, paths.userGroups(uid));
    const newGroupRef: DatabaseReference = push(groupsRef);

    await set(newGroupRef, {
      ...group,
      createdAt: new Date().toISOString(),
    });

    console.log('✅ تم إضافة المجموعة:', newGroupRef.key);
    return newGroupRef.key;
  } catch (error) {
    console.error('❌ خطأ في إضافة المجموعة:', error);
    return null;
  }
};

// ✅ تحديث مجموعة
export const updateGroup = async (
  uid: string,
  groupId: string,
  updates: Partial<Group>
): Promise<boolean> => {
  try {
    const groupRef = ref(database, paths.group(uid, groupId));
    await update(groupRef, updates);

    console.log('✅ تم تحديث المجموعة:', groupId);
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث المجموعة:', error);
    return false;
  }
};

// ✅ حذف مجموعة وكل فواتيرها
export const deleteGroup = async (uid: string, groupId: string): Promise<boolean> => {
  try {
    const groupRef = ref(database, paths.group(uid, groupId));
    await remove(groupRef);

    console.log('✅ تم حذف المجموعة:', groupId);
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف المجموعة:', error);
    return false;
  }
};

// ✅ مزامنة المجموعات في الوقت الفعلي
export const subscribeToGroups = (
  uid: string,
  callback: (groups: Group[]) => void
): Unsubscribe => {
  const groupsRef = ref(database, paths.userGroups(uid));

  const listener = onValue(
    groupsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const groups = Object.keys(data).map(key => ({
        ...data[key],
        id: key,
      })) as Group[];
      callback(groups);
    },
    (error) => {
      console.error('❌ خطأ في مزامنة المجموعات:', error);
      callback([]);
    }
  );

  return () => off(groupsRef, 'value', listener);
};

// ============================================================
// 👤 PROFILE - ملف المستخدم
// ============================================================

// ✅ حفظ ملف المستخدم
export const saveUserProfile = async (
  uid: string,
  profile: { displayName: string; email?: string; photoURL?: string }
): Promise<boolean> => {
  try {
    const profileRef = ref(database, paths.userProfile(uid));
    await set(profileRef, {
      ...profile,
      uid,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ تم حفظ ملف المستخدم:', uid);
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ ملف المستخدم:', error);
    return false;
  }
};

// ✅ جلب ملف المستخدم
export const fetchUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const profileRef = ref(database, paths.userProfile(uid));
    const snapshot = await get(profileRef);

    if (!snapshot.exists()) return null;

    return snapshot.val() as User;
  } catch (error) {
    console.error('❌ خطأ في جلب ملف المستخدم:', error);
    return null;
  }
};

// ============================================================
// 👥 FRIENDS - الأصدقاء
// ============================================================

// ✅ جلب الأصدقاء
export const fetchFriends = async (uid: string): Promise<User[]> => {
  try {
    const friendsRef = ref(database, paths.userFriends(uid));
    const snapshot = await get(friendsRef);

    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      ...data[key],
      id: key,
    })) as User[];
  } catch (error) {
    console.error('❌ خطأ في جلب الأصدقاء:', error);
    return [];
  }
};

// ✅ إضافة صديق
export const addFriend = async (uid: string, friend: Omit<User, 'id'>): Promise<string | null> => {
  try {
    const friendsRef = ref(database, paths.userFriends(uid));
    const newFriendRef = push(friendsRef);
    await set(newFriendRef, friend);

    console.log('✅ تم إضافة الصديق:', newFriendRef.key);
    return newFriendRef.key;
  } catch (error) {
    console.error('❌ خطأ في إضافة الصديق:', error);
    return null;
  }
};

// ✅ حذف صديق
export const deleteFriend = async (uid: string, friendId: string): Promise<boolean> => {
  try {
    const friendRef = ref(database, `users/${uid}/friends/${friendId}`);
    await remove(friendRef);

    console.log('✅ تم حذف الصديق:', friendId);
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف الصديق:', error);
    return false;
  }
};

// ============================================================
// 🔄 SYNC - مزامنة كاملة عند تسجيل الدخول
// ============================================================

export const syncAllUserData = async (uid: string): Promise<{
  bills: Bill[];
  groups: Group[];
  friends: User[];
  profile: User | null;
}> => {
  try {
    const [bills, groups, friends, profile] = await Promise.all([
      fetchBills(uid),
      fetchGroups(uid),
      fetchFriends(uid),
      fetchUserProfile(uid),
    ]);

    console.log('✅ تمت المزامنة الكاملة للمستخدم:', uid);
    return { bills, groups, friends, profile };
  } catch (error) {
    console.error('❌ خطأ في المزامنة الكاملة:', error);
    return { bills: [], groups: [], friends: [], profile: null };
  }
};
