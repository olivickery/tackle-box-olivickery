'use client';

import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Wordmark from './Wordmark';

type Mode = 'signin' | 'signup' | 'forgot' | 'recovery';

const inputClass =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60';

const SUBTITLES: Record<Mode, string> = {
  signin: 'Sign in for smart gear management',
  signup: 'Create your vault',
  forgot: 'Reset your password',
  recovery: 'Choose a new password',
};

const SUBMIT_LABELS: Record<Mode, string> = {
  signin: 'SIGN IN',
  signup: 'CREATE ACCOUNT',
  forgot: 'SEND RESET LINK',
  recovery: 'SAVE NEW PASSWORD',
};

export default function AuthGate({
  children,
}: {
  children: (session: Session) => React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  // A reset-email link lands with "type=recovery" in the URL hash.
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== 'undefined' && window.location.hash.includes('type=recovery') ? 'recovery' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Arrived from a reset-password email: hold the vault back until a new password is set.
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery');
        setError(null);
        setNotice(null);
        setPassword('');
        setConfirmPassword('');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        switchMode('signin');
        setNotice('Account created. Check your email to confirm, then sign in.');
      }
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setError(error.message);
      } else {
        // Same message whether or not the account exists, so emails can't be probed.
        setNotice('If an account exists for that email, a reset link is on its way. Check your inbox.');
      }
    } else if (mode === 'recovery') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setError(error.message);
        } else {
          switchMode('signin');
          // Session is already active, so this drops straight into the vault.
        }
      }
    }
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (session && mode !== 'recovery') {
    // Key on user id so switching accounts fully remounts the app state.
    return <React.Fragment key={session.user.id}>{children(session)}</React.Fragment>;
  }

  const showEmail = mode !== 'recovery';
  const showPassword = mode !== 'forgot';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h1 className="text-xl leading-none mb-1"><Wordmark /></h1>
        <p className="text-xs text-slate-400 font-mono mb-6">{SUBTITLES[mode]}</p>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <Check className="w-4 h-4 shrink-0 mt-px" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {showEmail && (
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          )}
          {showPassword && (
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder={mode === 'recovery' ? 'New password' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          )}
          {mode === 'recovery' && (
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          )}

          {mode === 'signin' && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-mono text-xs font-bold py-2.5 flex items-center justify-center gap-2 transition"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {SUBMIT_LABELS[mode]}
          </button>
        </form>

        {mode !== 'recovery' && (
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-200 transition"
          >
            {mode === 'signin' ? 'New here? Create an account' : mode === 'signup' ? 'Already have an account? Sign in' : 'Back to sign in'}
          </button>
        )}
      </div>
    </div>
  );
}
