// ============================================
// Firebase Authentication Service (Simulated)
// ============================================
// In a real Flutter app, this would use:
//   - firebase_auth package
//   - FirebaseAuth.instance.verifyPhoneNumber()
//
// This simulation mimics the exact Firebase Auth flow:
// 1. User enters phone number
// 2. Firebase sends SMS with OTP
// 3. User enters OTP code
// 4. Firebase verifies and returns user

export interface FirebaseUser {
  uid: string;
  phoneNumber: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  verificationId: string | null;
  codeSent: boolean;
  isVerifying: boolean;
}

export type AuthError =
  | 'invalid-phone-number'
  | 'too-many-requests'
  | 'network-error'
  | 'invalid-verification-code'
  | 'session-expired'
  | 'quota-exceeded'
  | 'unknown';

const ERROR_MESSAGES: Record<AuthError, string> = {
  'invalid-phone-number': 'رقم الهاتف غير صحيح. تأكد من إدخال رقم صالح.',
  'too-many-requests': 'تم تجاوز عدد المحاولات المسموح. حاول بعد قليل.',
  'network-error': 'خطأ في الاتصال بالإنترنت. تحقق من اتصالك.',
  'invalid-verification-code': 'رمز التحقق غير صحيح. تأكد من الرمز المرسل.',
  'session-expired': 'انتهت صلاحية الجلسة. أعد إرسال رمز التحقق.',
  'quota-exceeded': 'تم تجاوز الحد المسموح. حاول لاحقاً.',
  'unknown': 'حدث خطأ غير متوقع. حاول مرة أخرى.',
};

export function getAuthErrorMessage(code: AuthError): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES['unknown'];
}

// Phone number validation
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  if (!cleaned) {
    return { valid: false, error: 'يرجى إدخال رقم الهاتف' };
  }

  // Saudi Arabia format: 05XXXXXXXX (10 digits) or 9665XXXXXXXX (12 digits)
  // Also accept international format with +
  if (cleaned.length < 9) {
    return { valid: false, error: 'رقم الهاتف قصير جداً' };
  }

  if (cleaned.length > 15) {
    return { valid: false, error: 'رقم الهاتف طويل جداً' };
  }

  // Check Saudi format
  const saudiRegex = /^(966|0)?5[0-9]{8}$/;
  const internationalRegex = /^[1-9]\d{8,14}$/;

  if (!saudiRegex.test(cleaned) && !internationalRegex.test(cleaned)) {
    return { valid: false, error: 'صيغة رقم الهاتف غير صحيحة' };
  }

  return { valid: true };
}

// Format phone number for display
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // Saudi format
  if (cleaned.startsWith('966')) {
    const local = cleaned.slice(3);
    return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }

  if (cleaned.startsWith('05') || cleaned.startsWith('5')) {
    const num = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    return `+966 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
  }

  return `+${cleaned}`;
}

// Normalize phone number to E.164 format
export function normalizePhoneNumber(phone: string, countryCode: string = '966'): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = countryCode + cleaned.slice(1);
  } else if (!cleaned.startsWith(countryCode) && cleaned.length <= 10) {
    cleaned = countryCode + cleaned;
  }

  return '+' + cleaned;
}

// ============================================
// Simulated Firebase Auth Methods
// ============================================

// Simulate sending OTP via Firebase
export async function sendOTP(phoneNumber: string): Promise<{
  success: boolean;
  verificationId?: string;
  error?: AuthError;
}> {
  // Simulate network delay (1.5 - 2.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Simulate occasional errors (10% chance)
  const rand = Math.random();
  if (rand < 0.05) {
    return { success: false, error: 'network-error' };
  }
  if (rand < 0.08) {
    return { success: false, error: 'too-many-requests' };
  }

  // Generate a fake verification ID (like Firebase does)
  const verificationId = 'vid_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  // In real Firebase: FirebaseAuth.instance.verifyPhoneNumber(
  //   phoneNumber: phoneNumber,
  //   verificationCompleted: (credential) => {},
  //   verificationFailed: (error) => {},
  //   codeSent: (verificationId, resendToken) => {},
  //   codeAutoRetrievalTimeout: (verificationId) => {},
  // );

  console.log(`📱 OTP sent to ${phoneNumber}`);
  console.log(`🔑 Verification ID: ${verificationId}`);
  console.log(`🔢 Demo OTP code: 123456`);

  return { success: true, verificationId };
}

// Simulate verifying OTP code
export async function verifyOTP(
  verificationId: string,
  otpCode: string
): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: AuthError;
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Check verification ID
  if (!verificationId) {
    return { success: false, error: 'session-expired' };
  }

  // Demo: accept "123456" as valid OTP
  if (otpCode !== '123456') {
    return { success: false, error: 'invalid-verification-code' };
  }

  // In real Firebase:
  // PhoneAuthCredential credential = PhoneAuthProvider.credential(
  //   verificationId: verificationId,
  //   smsCode: otpCode,
  // );
  // UserCredential userCredential = await FirebaseAuth.instance.signInWithCredential(credential);

  const user: FirebaseUser = {
    uid: 'uid_' + Math.random().toString(36).substring(2, 10),
    phoneNumber: '+966501234567',
    displayName: null,
    photoURL: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  return { success: true, user };
}

// Simulate resending OTP
export async function resendOTP(phoneNumber: string): Promise<{
  success: boolean;
  verificationId?: string;
  error?: AuthError;
}> {
  return sendOTP(phoneNumber);
}

// Simulate sign out
export async function signOut(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('👋 User signed out');
}

// ============================================
// Country codes for phone input
// ============================================
export interface CountryCode {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
  nameAr: string;
}

export const countryCodes: CountryCode[] = [
  // ===== الخليج العربي =====
  { code: 'SA', dialCode: '+966', flag: '🇸🇦', name: 'Saudi Arabia',       nameAr: 'السعودية' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', name: 'UAE',                nameAr: 'الإمارات' },
  { code: 'KW', dialCode: '+965', flag: '🇰🇼', name: 'Kuwait',             nameAr: 'الكويت' },
  { code: 'BH', dialCode: '+973', flag: '🇧🇭', name: 'Bahrain',            nameAr: 'البحرين' },
  { code: 'QA', dialCode: '+974', flag: '🇶🇦', name: 'Qatar',              nameAr: 'قطر' },
  { code: 'OM', dialCode: '+968', flag: '🇴🇲', name: 'Oman',               nameAr: 'عُمان' },

  // ===== المشرق العربي =====
  { code: 'PS', dialCode: '+970', flag: '🇵🇸', name: 'Palestine',          nameAr: 'فلسطين' },
  { code: 'JO', dialCode: '+962', flag: '🇯🇴', name: 'Jordan',             nameAr: 'الأردن' },
  { code: 'LB', dialCode: '+961', flag: '🇱🇧', name: 'Lebanon',            nameAr: 'لبنان' },
  { code: 'SY', dialCode: '+963', flag: '🇸🇾', name: 'Syria',              nameAr: 'سوريا' },
  { code: 'IQ', dialCode: '+964', flag: '🇮🇶', name: 'Iraq',               nameAr: 'العراق' },
  { code: 'YE', dialCode: '+967', flag: '🇾🇪', name: 'Yemen',              nameAr: 'اليمن' },

  // ===== شمال أفريقيا =====
  { code: 'EG', dialCode: '+20',  flag: '🇪🇬', name: 'Egypt',              nameAr: 'مصر' },
  { code: 'MA', dialCode: '+212', flag: '🇲🇦', name: 'Morocco',            nameAr: 'المغرب' },
  { code: 'DZ', dialCode: '+213', flag: '🇩🇿', name: 'Algeria',            nameAr: 'الجزائر' },
  { code: 'TN', dialCode: '+216', flag: '🇹🇳', name: 'Tunisia',            nameAr: 'تونس' },
  { code: 'LY', dialCode: '+218', flag: '🇱🇾', name: 'Libya',              nameAr: 'ليبيا' },

  // ===== أفريقيا جنوب الصحراء =====
  { code: 'SD', dialCode: '+249', flag: '🇸🇩', name: 'Sudan',              nameAr: 'السودان' },
  { code: 'SS', dialCode: '+211', flag: '🇸🇸', name: 'South Sudan',        nameAr: 'جنوب السودان' },
  { code: 'SO', dialCode: '+252', flag: '🇸🇴', name: 'Somalia',            nameAr: 'الصومال' },
  { code: 'MR', dialCode: '+222', flag: '🇲🇷', name: 'Mauritania',         nameAr: 'موريتانيا' },
  { code: 'DJ', dialCode: '+253', flag: '🇩🇯', name: 'Djibouti',           nameAr: 'جيبوتي' },
  { code: 'KM', dialCode: '+269', flag: '🇰🇲', name: 'Comoros',            nameAr: 'جزر القمر' },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬', name: 'Nigeria',            nameAr: 'نيجيريا' },
  { code: 'ET', dialCode: '+251', flag: '🇪🇹', name: 'Ethiopia',           nameAr: 'إثيوبيا' },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', name: 'Kenya',              nameAr: 'كينيا' },
  { code: 'ZA', dialCode: '+27',  flag: '🇿🇦', name: 'South Africa',       nameAr: 'جنوب أفريقيا' },
  { code: 'GH', dialCode: '+233', flag: '🇬🇭', name: 'Ghana',              nameAr: 'غانا' },
  { code: 'TZ', dialCode: '+255', flag: '🇹🇿', name: 'Tanzania',           nameAr: 'تنزانيا' },
  { code: 'UG', dialCode: '+256', flag: '🇺🇬', name: 'Uganda',             nameAr: 'أوغندا' },
  { code: 'CM', dialCode: '+237', flag: '🇨🇲', name: 'Cameroon',           nameAr: 'الكاميرون' },

  // ===== آسيا =====
  { code: 'TR', dialCode: '+90',  flag: '🇹🇷', name: 'Turkey',             nameAr: 'تركيا' },
  { code: 'IR', dialCode: '+98',  flag: '🇮🇷', name: 'Iran',               nameAr: 'إيران' },
  { code: 'PK', dialCode: '+92',  flag: '🇵🇰', name: 'Pakistan',           nameAr: 'باكستان' },
  { code: 'IN', dialCode: '+91',  flag: '🇮🇳', name: 'India',              nameAr: 'الهند' },
  { code: 'BD', dialCode: '+880', flag: '🇧🇩', name: 'Bangladesh',         nameAr: 'بنغلاديش' },
  { code: 'AF', dialCode: '+93',  flag: '🇦🇫', name: 'Afghanistan',        nameAr: 'أفغانستان' },
  { code: 'MY', dialCode: '+60',  flag: '🇲🇾', name: 'Malaysia',           nameAr: 'ماليزيا' },
  { code: 'ID', dialCode: '+62',  flag: '🇮🇩', name: 'Indonesia',          nameAr: 'إندونيسيا' },
  { code: 'PH', dialCode: '+63',  flag: '🇵🇭', name: 'Philippines',        nameAr: 'الفلبين' },
  { code: 'CN', dialCode: '+86',  flag: '🇨🇳', name: 'China',              nameAr: 'الصين' },
  { code: 'JP', dialCode: '+81',  flag: '🇯🇵', name: 'Japan',              nameAr: 'اليابان' },
  { code: 'KR', dialCode: '+82',  flag: '🇰🇷', name: 'South Korea',        nameAr: 'كوريا الجنوبية' },
  { code: 'NP', dialCode: '+977', flag: '🇳🇵', name: 'Nepal',              nameAr: 'نيبال' },
  { code: 'LK', dialCode: '+94',  flag: '🇱🇰', name: 'Sri Lanka',          nameAr: 'سريلانكا' },
  { code: 'MM', dialCode: '+95',  flag: '🇲🇲', name: 'Myanmar',            nameAr: 'ميانمار' },

  // ===== آسيا الوسطى =====
  { code: 'UZ', dialCode: '+998', flag: '🇺🇿', name: 'Uzbekistan',         nameAr: 'أوزبكستان' },
  { code: 'KZ', dialCode: '+7',   flag: '🇰🇿', name: 'Kazakhstan',         nameAr: 'كازاخستان' },
  { code: 'TJ', dialCode: '+992', flag: '🇹🇯', name: 'Tajikistan',         nameAr: 'طاجيكستان' },
  { code: 'AZ', dialCode: '+994', flag: '🇦🇿', name: 'Azerbaijan',         nameAr: 'أذربيجان' },

  // ===== أوروبا =====
  { code: 'GB', dialCode: '+44',  flag: '🇬🇧', name: 'United Kingdom',     nameAr: 'بريطانيا' },
  { code: 'DE', dialCode: '+49',  flag: '🇩🇪', name: 'Germany',            nameAr: 'ألمانيا' },
  { code: 'FR', dialCode: '+33',  flag: '🇫🇷', name: 'France',             nameAr: 'فرنسا' },
  { code: 'IT', dialCode: '+39',  flag: '🇮🇹', name: 'Italy',              nameAr: 'إيطاليا' },
  { code: 'ES', dialCode: '+34',  flag: '🇪🇸', name: 'Spain',              nameAr: 'إسبانيا' },
  { code: 'NL', dialCode: '+31',  flag: '🇳🇱', name: 'Netherlands',        nameAr: 'هولندا' },
  { code: 'SE', dialCode: '+46',  flag: '🇸🇪', name: 'Sweden',             nameAr: 'السويد' },
  { code: 'NO', dialCode: '+47',  flag: '🇳🇴', name: 'Norway',             nameAr: 'النرويج' },
  { code: 'BE', dialCode: '+32',  flag: '🇧🇪', name: 'Belgium',            nameAr: 'بلجيكا' },
  { code: 'CH', dialCode: '+41',  flag: '🇨🇭', name: 'Switzerland',        nameAr: 'سويسرا' },
  { code: 'GR', dialCode: '+30',  flag: '🇬🇷', name: 'Greece',             nameAr: 'اليونان' },
  { code: 'RU', dialCode: '+7',   flag: '🇷🇺', name: 'Russia',             nameAr: 'روسيا' },

  // ===== أمريكا =====
  { code: 'US', dialCode: '+1',   flag: '🇺🇸', name: 'United States',      nameAr: 'أمريكا' },
  { code: 'CA', dialCode: '+1',   flag: '🇨🇦', name: 'Canada',             nameAr: 'كندا' },
  { code: 'MX', dialCode: '+52',  flag: '🇲🇽', name: 'Mexico',             nameAr: 'المكسيك' },
  { code: 'BR', dialCode: '+55',  flag: '🇧🇷', name: 'Brazil',             nameAr: 'البرازيل' },
  { code: 'AR', dialCode: '+54',  flag: '🇦🇷', name: 'Argentina',          nameAr: 'الأرجنتين' },

  // ===== أوقيانوسيا =====
  { code: 'AU', dialCode: '+61',  flag: '🇦🇺', name: 'Australia',          nameAr: 'أستراليا' },
  { code: 'NZ', dialCode: '+64',  flag: '🇳🇿', name: 'New Zealand',        nameAr: 'نيوزيلندا' },
];
