import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useApp } from './AppContext';

interface Notification {
  id: string;
  type: 'unpaid' | 'you_owe' | 'completed' | 'reminder';
  title: string;
  message: string;
  billId?: string;
  groupName?: string;
  amount?: number;
  personName?: string;
  isUrgent: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  dismissNotification: (id: string) => void;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  isRead: (id: string) => boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const DISMISSED_KEY = 'qassimha_notif_dismissed_v3';
const READ_KEY      = 'qassimha_notif_read_v3';

function loadIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set<string>(arr);
    }
  } catch {}
  return new Set<string>();
}

function saveIds(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { bills, users, groups } = useApp();

  // ── نحمّل الحالة مرة واحدة فقط عند البناء
  const dismissedRef = useRef<Set<string>>(loadIds(DISMISSED_KEY));
  const readRef      = useRef<Set<string>>(loadIds(READ_KEY));

  // ── State للـ re-render فقط
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate(n => n + 1), []);

  // ── توليد كل الإشعارات الممكنة
  const allNotifications = useCallback((): Notification[] => {
    const generated: Notification[] = [];

    bills.forEach(bill => {
      const group = groups.find(g => g.id === bill.groupId);
      const groupName = group?.name || '';

      // أنا دفعت الفاتورة (paidBy = user-1)
      if (bill.paidBy === 'user-1') {
        bill.splits.forEach(split => {
          if (split.userId !== 'user-1' && !split.paid) {
            const user = users.find(u => u.id === split.userId);
            const personName = user?.name || 'شخص';
            generated.push({
              id: `unpaid-${bill.id}-${split.userId}`,
              type: 'unpaid',
              title: `${personName} لم يدفع بعد`,
              message: `مطلوب ${split.amount.toFixed(1)} من فاتورة "${bill.title}" في ${groupName}`,
              billId: bill.id,
              groupName,
              amount: split.amount,
              personName,
              isUrgent: true,
              createdAt: bill.createdAt,
            });
          }
        });
      } else {
        // شخص آخر دفع - هل عليّ حصة؟
        const mySplit = bill.splits.find(s => s.userId === 'user-1');
        if (mySplit && !mySplit.paid) {
          const payer = users.find(u => u.id === bill.paidBy);
          const payerName = payer?.name || 'شخص';
          generated.push({
            id: `owe-${bill.id}`,
            type: 'you_owe',
            title: `عليك دفع حصتك`,
            message: `${mySplit.amount.toFixed(1)} لـ ${payerName} من فاتورة "${bill.title}" في ${groupName}`,
            billId: bill.id,
            groupName,
            amount: mySplit.amount,
            personName: payerName,
            isUrgent: false,
            createdAt: bill.createdAt,
          });
        }
      }

      // فاتورة مكتملة (كل الأشخاص دفعوا)
      const allPaid = bill.splits.length > 1 && bill.splits.every(s => s.paid);
      if (allPaid) {
        generated.push({
          id: `complete-${bill.id}`,
          type: 'completed',
          title: `تمت التسوية ✅`,
          message: `فاتورة "${bill.title}" في ${groupName} - تم دفع الكل`,
          billId: bill.id,
          groupName,
          isUrgent: false,
          createdAt: bill.createdAt,
        });
      }
    });

    return generated;
  }, [bills, users, groups]);

  // ── الإشعارات المرئية = الكل - المحذوفة
  const visibleNotifications = allNotifications().filter(
    n => !dismissedRef.current.has(n.id)
  );

  // ── عدد غير المقروءة
  const unreadCount = visibleNotifications.filter(
    n => !readRef.current.has(n.id)
  ).length;

  // ── حذف إشعار نهائياً
  const dismissNotification = useCallback((id: string) => {
    dismissedRef.current = new Set([...dismissedRef.current, id]);
    readRef.current = new Set([...readRef.current, id]);
    saveIds(DISMISSED_KEY, dismissedRef.current);
    saveIds(READ_KEY, readRef.current);
    rerender();
  }, [rerender]);

  // ── قراءة إشعار واحد
  const markAsRead = useCallback((id: string) => {
    if (readRef.current.has(id)) return;
    readRef.current = new Set([...readRef.current, id]);
    saveIds(READ_KEY, readRef.current);
    rerender();
  }, [rerender]);

  // ── قراءة الكل
  const markAllRead = useCallback(() => {
    const visible = allNotifications().filter(n => !dismissedRef.current.has(n.id));
    const allIds = visible.map(n => n.id);
    readRef.current = new Set([...readRef.current, ...allIds]);
    saveIds(READ_KEY, readRef.current);
    rerender();
  }, [allNotifications, rerender]);

  // ── هل إشعار مقروء؟
  const isRead = useCallback((id: string) => {
    return readRef.current.has(id);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications: visibleNotifications,
      unreadCount,
      dismissNotification,
      markAllRead,
      markAsRead,
      isRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
