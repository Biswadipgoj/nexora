'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

/**
 * Forgot password page.
 * §3.7: Password reset flow.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-form">
        <div style={{ textAlign: 'center' }}>
          <h2 className="auth-form__title">Check your email</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', marginTop: 'var(--space-2)' }}>
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link.
          </p>
          <Link href="/auth/login" className="auth-form__link">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2 className="auth-form__title">Reset your password</h2>
      <p className="auth-form__subtitle">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div className="auth-form__error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleReset} className="auth-form__fields">
        <div className="auth-form__field">
          <label htmlFor="reset-email" className="auth-form__label">
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            autoFocus
            disabled={loading}
            className="auth-form__input"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-form__submit">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-form__footer">
        Remember your password?{' '}
        <Link href="/auth/login" className="auth-form__link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
