import axios, { type AxiosInstance } from 'axios';

const rawBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
export const API_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

function getToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setToken(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}

function createClient(tokenKey: string, refreshKey: string): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = getToken(tokenKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const refreshToken = getToken(refreshKey);

      if (error.response?.status === 401 && refreshToken && !original._retry) {
        original._retry = true;
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          setToken(tokenKey, res.data.data.accessToken);
          setToken(refreshKey, res.data.data.refreshToken);
          original.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return client(original);
        } catch {
          setToken(tokenKey, null);
          setToken(refreshKey, null);
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const api = createClient('yo1_access_token', 'yo1_refresh_token');
export const adminApi = createClient('yo1_admin_access_token', 'yo1_admin_refresh_token');

export function setAccessToken(token: string | null) {
  setToken('yo1_access_token', token);
}

export function setAdminToken(token: string | null) {
  setToken('yo1_admin_access_token', token);
}

const firebaseErrorMessages: Record<string, string> = {
  'auth/invalid-phone-number': 'Invalid phone number. Check the number and try again.',
  'auth/missing-phone-number': 'Enter a valid phone number.',
  'auth/operation-not-allowed': 'Phone sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
  'auth/too-many-requests': 'Too many requests. Please wait a while and try again.',
  'auth/invalid-verification-code': 'Incorrect OTP. Check the code and try again.',
  'auth/missing-verification-code': 'Enter the OTP code.',
  'auth/code-expired': 'The OTP has expired. Request a new one.',
  'auth/captcha-check-failed':
    'reCAPTCHA failed (auth/captcha-check-failed) — the Firebase project enforces reCAPTCHA Enterprise. For development, add a Test phone number in Firebase Console → Authentication → Phone → Test phone numbers (no reCAPTCHA needed).',
  'auth/invalid-app-credential':
    'reCAPTCHA failed (auth/invalid-app-credential) — add localhost to Firebase Console → Authentication → Settings → Authorized domains.',
  'auth/unauthorized-domain':
    'This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
  'auth/internal-error': 'Something went wrong during sign-in. Please try again.',
  'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
  'auth/user-not-found': 'No account found for this phone number.',
  'auth/email-already-in-use': 'This email is already registered.',
};

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (msg) return msg;
    return err.message || 'Something went wrong';
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string' && code.startsWith('auth/')) {
      return firebaseErrorMessages[code] || `Authentication failed (${code}). Please try again.`;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong';
}
