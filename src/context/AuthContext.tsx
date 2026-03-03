// ============================================
// Auth Provider - State Management (Provider Pattern)
// ============================================
// In Flutter, this would be:
//   class AuthProvider extends ChangeNotifier { ... }
//   ChangeNotifierProvider<AuthProvider>(...)
//
// React Context serves the same purpose as Flutter's Provider

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import { useLocalStorage, STORAGE_KEYS } from '@/hooks/useLocalStorage';
import type { FirebaseUser, AuthError, CountryCode } from '@/services/authService';
import {
  sendOTP,
  verifyOTP,
  resendOTP,
  signOut as authSignOut,
  getAuthErrorMessage,
  validatePhoneNumber,
  normalizePhoneNumber,
  countryCodes,
} from '@/services/authService';

// ============================================
// State Definition
// ============================================
interface AuthState {
  // Auth status
  isAuthenticated: boolean;
  user: FirebaseUser | null;

  // Phone input
  phoneNumber: string;
  selectedCountry: CountryCode;

  // OTP flow
  verificationId: string | null;
  otpCode: string;
  codeSent: boolean;

  // UI states
  isLoading: boolean;
  isVerifying: boolean;
  isSendingAgain: boolean;

  // Error handling
  error: string | null;
  phoneError: string | null;
  otpError: string | null;

  // Timer for resend
  resendTimer: number;
  canResend: boolean;

  // Terms
  termsAccepted: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  phoneNumber: '',
  selectedCountry: countryCodes[0], // Saudi Arabia
  verificationId: null,
  otpCode: '',
  codeSent: false,
  isLoading: false,
  isVerifying: false,
  isSendingAgain: false,
  error: null,
  phoneError: null,
  otpError: null,
  resendTimer: 0,
  canResend: true,
  termsAccepted: false,
};

// ============================================
// Actions (Reducer Pattern)
// ============================================
type AuthAction =
  | { type: 'SET_PHONE'; payload: string }
  | { type: 'SET_COUNTRY'; payload: CountryCode }
  | { type: 'SET_OTP'; payload: string }
  | { type: 'SET_TERMS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_VERIFYING'; payload: boolean }
  | { type: 'SET_SENDING_AGAIN'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PHONE_ERROR'; payload: string | null }
  | { type: 'SET_OTP_ERROR'; payload: string | null }
  | { type: 'OTP_SENT'; payload: string }
  | { type: 'AUTH_SUCCESS'; payload: FirebaseUser }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'RESET_OTP' }
  | { type: 'RESET_ALL' }
  | { type: 'SET_RESEND_TIMER'; payload: number }
  | { type: 'SIGN_OUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_PHONE':
      return { ...state, phoneNumber: action.payload, phoneError: null, error: null };
    case 'SET_COUNTRY':
      return { ...state, selectedCountry: action.payload };
    case 'SET_OTP':
      return { ...state, otpCode: action.payload, otpError: null, error: null };
    case 'SET_TERMS':
      return { ...state, termsAccepted: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_VERIFYING':
      return { ...state, isVerifying: action.payload };
    case 'SET_SENDING_AGAIN':
      return { ...state, isSendingAgain: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PHONE_ERROR':
      return { ...state, phoneError: action.payload };
    case 'SET_OTP_ERROR':
      return { ...state, otpError: action.payload };
    case 'OTP_SENT':
      return {
        ...state,
        codeSent: true,
        verificationId: action.payload,
        isLoading: false,
        error: null,
        otpCode: '',
        resendTimer: 60,
        canResend: false,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isVerifying: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isVerifying: false,
        otpError: action.payload,
      };
    case 'RESET_OTP':
      return {
        ...state,
        codeSent: false,
        verificationId: null,
        otpCode: '',
        otpError: null,
        error: null,
        isLoading: false,
        isVerifying: false,
      };
    case 'RESET_ALL':
      return initialState;
    case 'SET_RESEND_TIMER':
      return {
        ...state,
        resendTimer: action.payload,
        canResend: action.payload === 0,
      };
    case 'SIGN_OUT':
      return initialState;
    default:
      return state;
  }
}

// ============================================
// Context & Provider
// ============================================
interface AuthContextType {
  state: AuthState;
  setPhone: (phone: string) => void;
  setCountry: (country: CountryCode) => void;
  setOtp: (code: string) => void;
  setTerms: (accepted: boolean) => void;
  handleSendOTP: () => Promise<void>;
  handleVerifyOTP: () => Promise<void>;
  handleResendOTP: () => Promise<void>;
  handleGoBack: () => void;
  handleSignOut: () => Promise<void>;
  decrementTimer: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ── حفظ المستخدم المصادَق في localStorage ─────────────────────
  const [savedUser, setSavedUser, removeSavedUser] = useLocalStorage<FirebaseUser | null>(
    STORAGE_KEYS.AUTH_USER,
    null
  );
  const [savedPhone, setSavedPhone] = useLocalStorage<string>(
    STORAGE_KEYS.AUTH_PHONE,
    ''
  );

  // ── استعادة الجلسة من localStorage عند أول تشغيل ──────────────
  const restoredInitialState: AuthState = savedUser
    ? { ...initialState, isAuthenticated: true, user: savedUser, phoneNumber: savedPhone }
    : { ...initialState, phoneNumber: savedPhone };

  const [state, dispatch] = useReducer(authReducer, restoredInitialState);

  const setPhone = useCallback((phone: string) => {
    const filtered = phone.replace(/[^\d\s\-()]/g, '');
    setSavedPhone(filtered);
    dispatch({ type: 'SET_PHONE', payload: filtered });
  }, [setSavedPhone]);

  const setCountry = useCallback((country: CountryCode) => {
    dispatch({ type: 'SET_COUNTRY', payload: country });
  }, []);

  const setOtp = useCallback((code: string) => {
    // Only allow digits, max 6
    const filtered = code.replace(/\D/g, '').slice(0, 6);
    dispatch({ type: 'SET_OTP', payload: filtered });
  }, []);

  const setTerms = useCallback((accepted: boolean) => {
    dispatch({ type: 'SET_TERMS', payload: accepted });
  }, []);

  const handleSendOTP = useCallback(async () => {
    // Validate phone
    const cleanPhone = state.phoneNumber.replace(/\D/g, '');
    const validation = validatePhoneNumber(cleanPhone);

    if (!validation.valid) {
      dispatch({ type: 'SET_PHONE_ERROR', payload: validation.error || 'رقم غير صحيح' });
      return;
    }

    if (!state.termsAccepted) {
      dispatch({ type: 'SET_ERROR', payload: 'يرجى الموافقة على الشروط والأحكام' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const normalizedPhone = normalizePhoneNumber(cleanPhone, state.selectedCountry.dialCode.replace('+', ''));
      const result = await sendOTP(normalizedPhone);

      if (result.success && result.verificationId) {
        dispatch({ type: 'OTP_SENT', payload: result.verificationId });
      } else {
        const errorMsg = result.error
          ? getAuthErrorMessage(result.error)
          : 'فشل إرسال رمز التحقق';
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ غير متوقع. حاول مرة أخرى.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.phoneNumber, state.termsAccepted, state.selectedCountry]);

  const handleVerifyOTP = useCallback(async () => {
    if (state.otpCode.length !== 6) {
      dispatch({ type: 'SET_OTP_ERROR', payload: 'أدخل رمز التحقق المكون من 6 أرقام' });
      return;
    }

    if (!state.verificationId) {
      dispatch({ type: 'SET_OTP_ERROR', payload: 'انتهت الجلسة. أعد إرسال الرمز.' });
      return;
    }

    dispatch({ type: 'SET_VERIFYING', payload: true });
    dispatch({ type: 'SET_OTP_ERROR', payload: null });

    try {
      const result = await verifyOTP(state.verificationId, state.otpCode);

      if (result.success && result.user) {
        setSavedUser(result.user);   // ← حفظ المستخدم في localStorage
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
      } else {
        const errorMsg = result.error
          ? getAuthErrorMessage(result.error as AuthError)
          : 'فشل التحقق من الرمز';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMsg });
      }
    } catch {
      dispatch({ type: 'AUTH_FAILURE', payload: 'حدث خطأ غير متوقع' });
    }
  }, [state.otpCode, state.verificationId]);

  const handleResendOTP = useCallback(async () => {
    if (!state.canResend) return;

    dispatch({ type: 'SET_SENDING_AGAIN', payload: true });

    try {
      const cleanPhone = state.phoneNumber.replace(/\D/g, '');
      const normalizedPhone = normalizePhoneNumber(cleanPhone, state.selectedCountry.dialCode.replace('+', ''));
      const result = await resendOTP(normalizedPhone);

      if (result.success && result.verificationId) {
        dispatch({ type: 'OTP_SENT', payload: result.verificationId });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'فشل إعادة إرسال الرمز' });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ' });
    } finally {
      dispatch({ type: 'SET_SENDING_AGAIN', payload: false });
    }
  }, [state.canResend, state.phoneNumber, state.selectedCountry]);

  const handleGoBack = useCallback(() => {
    dispatch({ type: 'RESET_OTP' });
  }, []);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
    removeSavedUser();   // ← مسح المستخدم من localStorage
    dispatch({ type: 'SIGN_OUT' });
  }, [removeSavedUser]);

  const decrementTimer = useCallback(() => {
    dispatch({ type: 'SET_RESEND_TIMER', payload: Math.max(0, state.resendTimer - 1) });
  }, [state.resendTimer]);

  return (
    <AuthContext.Provider
      value={{
        state,
        setPhone,
        setCountry,
        setOtp,
        setTerms,
        handleSendOTP,
        handleVerifyOTP,
        handleResendOTP,
        handleGoBack,
        handleSignOut,
        decrementTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
