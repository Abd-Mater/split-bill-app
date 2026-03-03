# 🔥 دليل إعداد Firebase - تطبيق قسّمها

## ✅ ما تم إعداده مسبقاً:
- `databaseURL` → `https://splitter-app-a43c0-default-rtdb.firebaseio.com`
- `authDomain`  → `splitter-app-a43c0.firebaseapp.com`
- `projectId`   → `splitter-app-a43c0`

---

## 📋 الخطوات المتبقية (5 دقائق فقط):

### 1️⃣ احصل على بيانات المشروع:
1. اذهب إلى: https://console.firebase.google.com
2. اختر مشروعك: **splitter-app-a43c0**
3. اضغط ⚙️ **Project Settings**
4. انزل لقسم **Your Apps**
5. إذا لم يكن هناك Web App → اضغط **Add App** → اختر **Web (</>)**
6. سترى الـ Config هكذا:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← انسخ هذا
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "123456789", // ← انسخ هذا
  appId: "1:123:web:abc..."       // ← انسخ هذا
};
```

### 2️⃣ ضع البيانات في ملف الإعداد:
افتح الملف: `src/firebase/config.ts`

وعدّل هذه الأسطر الثلاثة فقط:
```typescript
apiKey:            "AIzaSy...",     // ← الصق هنا
messagingSenderId: "123456789",     // ← الصق هنا
appId:             "1:123:web:abc", // ← الصق هنا
```

### 3️⃣ فعّل Google Authentication:
1. Firebase Console → **Authentication**
2. اضغط **Sign-in method**
3. اختر **Google**
4. فعّله (Enable) ← اختر اسم المشروع والإيميل
5. اضغط **Save**

### 4️⃣ تأكد من Realtime Database:
1. Firebase Console → **Realtime Database**
2. إذا لم تنشئه → **Create Database** → اختر **Test mode**
3. تأكد أن الـ URL هو:
   `https://splitter-app-a43c0-default-rtdb.firebaseio.com`

### 5️⃣ اضبط Security Rules:
1. Realtime Database → **Rules**
2. الصق هذا:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```
3. اضغط **Publish**

---

## 🚀 تشغيل المشروع محلياً:

```bash
# تثبيت الحزم
npm install

# تشغيل المشروع
npm run dev

# بناء المشروع للنشر
npm run build
```

---

## 🏗️ هيكل قاعدة البيانات:

```
📦 Realtime Database: splitter-app-a43c0
└── users/
    └── {uid}/                          ← UID فريد لكل مستخدم من Google
        ├── profile/
        │   ├── displayName: "أحمد"
        │   ├── email: "ahmed@gmail.com"
        │   ├── photoURL: "https://..."
        │   └── updatedAt: "2024-01-01"
        │
        ├── bills/
        │   └── {auto-generated-id}/
        │       ├── title: "غداء"
        │       ├── totalAmount: 150
        │       ├── paidBy: "user-1"
        │       ├── groupId: "group-1"
        │       └── createdAt: "2024-01-01"
        │
        ├── groups/
        │   └── {auto-generated-id}/
        │       ├── name: "رحلة الشتاء"
        │       ├── emoji: "🏔️"
        │       └── members: [...]
        │
        └── friends/
            └── {auto-generated-id}/
                ├── name: "خالد"
                └── phone: "0501234567"
```

---

## 📱 كيف يعمل التطبيق:

```
المستخدم يفتح التطبيق
         ↓
هل هو مسجل دخول؟
   ↓ نعم              ↓ لا
الشاشة الرئيسية    شاشة Google Login
                         ↓
                   يضغط "تسجيل الدخول بـ Google"
                         ↓
                   Firebase يعطيه UID فريد
                         ↓
                   يُحفظ ملفه في /users/{uid}/profile
                         ↓
                   يُجلب بياناته من /users/{uid}/
                         ↓
                   الشاشة الرئيسية ✅
```

---

## 🔒 الخصوصية:
- كل مستخدم يرى **بياناته فقط** بفضل Security Rules
- عند تسجيل الخروج → تُمسح البيانات المؤقتة من المتصفح
- الـ UID يأتي من Google مباشرة (غير قابل للتزوير)
