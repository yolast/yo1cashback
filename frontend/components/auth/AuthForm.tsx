'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '@/store/auth';
import { isFirebaseConfigured, sendPhoneOtp, confirmPhoneOtp } from '@/lib/firebase';
import { getErrorMessage } from '@/lib/axios';
import { Spinner } from '@/components/ui/Spinner';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { loginWithGoogle, setPendingReferral, user, authError, clearAuthError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const referralCode = searchParams.get('ref') || '';

  const [method, setMethod] = useState<'google' | 'phone'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhone = phone.startsWith('+') ? phone : `${countryCode}${phone.replace(/\D/g, '')}`;
  const visibleError = error || authError;

  if (user) {
    router.replace(redirect);
    return null;
  }

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    clearAuthError();
    try {
      setPendingReferral(referralCode);
      await loginWithGoogle();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!/^\+[1-9]\d{6,14}$/.test(fullPhone)) {
      setError('Enter a valid phone number (e.g. 98765 43210).');
      return;
    }
    setLoading(true);
    setError('');
    clearAuthError();
    try {
      const result = await sendPhoneOtp(fullPhone);
      setConfirmation(result);
      setStep('code');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!confirmation || !code) return;
    setLoading(true);
    setError('');
    clearAuthError();
    try {
      setPendingReferral(referralCode);
      await confirmPhoneOtp(confirmation, code);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            Y1
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to continue earning cashback.' : 'Start earning cashback in minutes.'}
          </p>
        </div>

        {!isFirebaseConfigured() && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Firebase is not configured. Add your Firebase project keys to <code>.env.local</code>.
          </div>
        )}

        {visibleError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {visibleError}
          </div>
        )}

        <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => {
              setMethod('phone');
              setStep('phone');
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              method === 'phone' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Mobile OTP
          </button>
          <button
            onClick={() => setMethod('google')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              method === 'google' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Google
          </button>
        </div>

        {method === 'google' ? (
          <div className="mt-6 space-y-3">
            <button onClick={handleGoogle} disabled={loading} className="btn-secondary w-full">
              {loading ? <Spinner className="h-4 w-4" /> : <GoogleIcon />}
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {step === 'phone' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone number</label>
                  <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
                    <span className="flex items-center border-r border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                      {countryCode}
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="w-full flex-1 border-0 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">OTP will be sent to {fullPhone || countryCode}</p>
                </div>
                <div id="recaptcha-container" className="flex justify-center" />
                <button onClick={handleSendOtp} disabled={loading} className="btn-primary w-full">
                  {loading ? <Spinner className="h-4 w-4" /> : null}
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700">Enter OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="input mt-1 text-center text-lg tracking-[0.5em]"
                  />
                </div>
                <button onClick={handleVerify} disabled={loading || code.length < 6} className="btn-primary w-full">
                  {loading ? <Spinner className="h-4 w-4" /> : null}
                  Verify & sign in
                </button>
                <button
                  onClick={() => setStep('phone')}
                  disabled={loading}
                  className="w-full text-center text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Change number
                </button>
              </>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <Link href={`/register?redirect=${redirect}`} className="font-semibold text-brand-600 hover:text-brand-700">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href={`/login?redirect=${redirect}`} className="font-semibold text-brand-600 hover:text-brand-700">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
