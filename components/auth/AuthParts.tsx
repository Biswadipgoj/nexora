'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Google and GitHub sign-in. Errors are reported to the caller's alert. */
export function OAuthButtons({
  disabled,
  onError,
  next,
}: {
  disabled?: boolean;
  onError: (message: string) => void;
  next?: string;
}) {
  async function start(provider: 'google' | 'github') {
    try {
      const supabase = createClient();
      const callback = new URL('/auth/callback', window.location.origin);
      if (next) callback.searchParams.set('next', next);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });
      if (error) onError(error.message);
    } catch {
      onError('Could not reach that sign-in provider. Try again, or use your email.');
    }
  }

  return (
    <div className="auth-oauth-stack">
      <button type="button" className="nx-btn nx-btn--secondary" onClick={() => start('google')} disabled={disabled}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </button>
      <button type="button" className="nx-btn nx-btn--secondary" onClick={() => start('github')} disabled={disabled}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
      </button>
    </div>
  );
}

/**
 * "Explore the demo workspace" — the last item on the sign-in screens, or the
 * main action (`prominent`) when the deployment has no account service.
 * Without an `onError` handler, failures are shown inline.
 */
export function DemoEntry({
  disabled,
  onError,
  prominent,
}: {
  disabled?: boolean;
  onError?: (message: string) => void;
  prominent?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoading(false);
      const message = 'Could not start the demo workspace. Check your connection and try again.';
      if (onError) onError(message);
      else setLocalError(message);
    }
  }

  if (prominent) {
    return (
      <div className="auth-form">
        {localError && (
          <div className="nx-alert nx-alert--error" role="alert">
            <span>{localError}</span>
          </div>
        )}
        <button
          type="button"
          className="nx-btn nx-btn--primary nx-btn--lg nx-btn--block"
          onClick={start}
          disabled={disabled || loading}
        >
          {loading && <span className="nx-spinner" aria-hidden="true" />}
          {loading ? 'Opening the demo workspace…' : 'Open the demo workspace'}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-demo">
      <button type="button" className="auth-demo__btn" onClick={start} disabled={disabled || loading}>
        {loading ? <span className="nx-spinner" aria-hidden="true" /> : null}
        {loading ? 'Opening the demo workspace…' : 'Explore the demo workspace'}
        {!loading && (
          <span className="auth-demo__arrow" aria-hidden="true">
            →
          </span>
        )}
      </button>
      <span className="auth-demo__hint">A sample project with a few weeks of work in it. No account needed.</span>
    </div>
  );
}

/** Password input with a text show/hide toggle. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  autoComplete,
  disabled,
  error,
  help,
  aside,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete: string;
  disabled?: boolean;
  error?: string;
  help?: string;
  aside?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;

  return (
    <div className="nx-field">
      <div className="auth-field-row">
        <label htmlFor={id} className="nx-label">
          {label}
        </label>
        {aside}
      </div>
      <div className="auth-password">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="nx-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          disabled={disabled}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="auth-password__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? (
        <span id={`${id}-error`} className="nx-field__error">
          {error}
        </span>
      ) : help ? (
        <span id={`${id}-help`} className="nx-field__help">
          {help}
        </span>
      ) : null}
    </div>
  );
}

/** Maps network failures onto a sentence a person can act on. */
export function describeAuthFailure(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : '';
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Cannot reach the sign-in service. Check your connection and try again.';
  }
  return message || fallback;
}
