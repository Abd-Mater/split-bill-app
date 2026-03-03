// ============================================================
// 🔥 Firebase Configuration - splitter-app-a43c0
// ============================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey:            'AIzaSyDH2NSpLfACWG2vU1jRFFi867T15V3E0mY',
  authDomain:        'splitter-app-a43c0.firebaseapp.com',
  databaseURL:       'https://splitter-app-a43c0-default-rtdb.firebaseio.com',
  projectId:         'splitter-app-a43c0',
  storageBucket:     'splitter-app-a43c0.firebasestorage.app',
  messagingSenderId: '259917476466',
  appId:             '1:259917476466:web:f5f8f775cc7789359048eb',
  measurementId:     'G-F0TY68FBZQ'
};

// ============================================================
// تهيئة Firebase (مرة واحدة فقط)
// ============================================================
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ============================================================
// الخدمات المُصدَّرة
// ============================================================
export const auth: Auth         = getAuth(app);
export const database: Database = getDatabase(app);
export default app;

// ============================================================
// 📌 دليل الإعداد النهائي:
//
// 1️⃣  تفعيل Google Authentication:
//     Firebase Console → Authentication → Sign-in method
//     → Google → Enable → Save
//
// 2️⃣  إضافة النطاق المصرح به:
//     Authentication → Settings → Authorized domains
//     → Add domain → أضف رابط موقعك على Vercel
//
// 3️⃣  Security Rules للـ Realtime Database:
//     Firebase Console → Realtime Database → Rules → والصق:
//
// {
//   "rules": {
//     "users": {
//       "$uid": {
//         ".read":  "$uid === auth.uid",
//         ".write": "$uid === auth.uid"
//       }
//     }
//   }
// }
//
// 4️⃣  هيكل قاعدة البيانات:
//     users/
//       {uid}/
//         profile/    ← معلومات المستخدم
//         bills/      ← فواتيره الخاصة فقط
//         groups/     ← مجموعاته
//         friends/    ← أصدقاؤه
// ============================================================
