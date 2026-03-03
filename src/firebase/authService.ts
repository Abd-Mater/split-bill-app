// ============================================================
// 🔐 Firebase Authentication Service
// ============================================================

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { auth } from './config';
import { saveUserProfile } from './billsService';

// ============================================================
// Google Auth Provider
// ============================================================
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ============================================================
// 🔑 تسجيل الدخول بـ Google
// ============================================================
export const signInWithGoogle = async (): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> => {
  try {
    let result: UserCredential;

    // على الموبايل استخدم Redirect، على الديسك توب Popup
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      return { success: true };
    } else {
      result = await signInWithPopup(auth, googleProvider);
    }

    const user = result.user;

    // حفظ ملف المستخدم في Realtime Database
    await saveUserProfile(user.uid, {
      displayName: user.displayName || 'مستخدم',
      email: user.email || '',
      photoURL: user.photoURL || '',
    });

    console.log('✅ تم تسجيل الدخول:', user.displayName);
    return { success: true, user };

  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('❌ خطأ في تسجيل الدخول:', firebaseError);

    let errorMessage = 'حدث خطأ في تسجيل الدخول';

    switch (firebaseError.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'تم إغلاق نافذة تسجيل الدخول';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'المتصفح حجب النافذة المنبثقة، جرب مرة أخرى';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'خطأ في الاتصال، تحقق من الإنترنت';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'تم إلغاء الطلب';
        break;
      case 'auth/unauthorized-domain':
        errorMessage = 'هذا النطاق غير مصرح له، أضفه في Firebase Console';
        break;
      default:
        errorMessage = firebaseError.message || 'حدث خطأ غير متوقع';
    }

    return { success: false, error: errorMessage };
  }
};

// ============================================================
// 📱 معالجة نتيجة Redirect (للموبايل)
// ============================================================
export const handleRedirectResult = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await saveUserProfile(result.user.uid, {
        displayName: result.user.displayName || 'مستخدم',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
      });
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('❌ خطأ في Redirect Result:', error);
    return null;
  }
};

// ============================================================
// 🚪 تسجيل الخروج
// ============================================================
export const signOutUser = async (): Promise<boolean> => {
  try {
    await signOut(auth);

    // مسح البيانات المؤقتة من localStorage
    const keysToKeep = ['qassimha_theme']; // احتفظ بإعدادات الثيم فقط
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    console.log('✅ تم تسجيل الخروج بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    return false;
  }
};

// ============================================================
// 👂 مراقبة حالة المصادقة
// ============================================================
export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================================
// 👤 الحصول على المستخدم الحالي
// ============================================================
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export type { FirebaseUser };
