'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { createClient } from '@/lib/supabase/client';
import { describeAuthFailure } from '@/components/auth/AuthParts';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter the email address you sign in with.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      // The link lands on the callback, which exchanges the code for a
      // recovery session and continues to the reset form. It used to point
      // straight at /auth/reset-password, a page that did not exist.
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', '/auth/reset-password');

      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: callback.toString(),
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(describeAuthFailure(err, 'Could not send the reset link. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-success">
        <span className="auth-success__mark" aria-hidden="true">
          <MarkEmailReadOutlinedIcon sx={{ fontSize: 20 }} />
        </span>
        <h1 className="auth-heading">Check your inbox</h1>
        <p className="auth-subheading">
          If an account matches <strong style={{ color: 'var(--nx-ink)' }}>{email}</strong>, a link to choose a new
          password is on its way. It expires in an hour.
        </p>
        <p className="auth-footer">
          <Link href="/auth/login" className="auth-link">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="auth-heading">Reset your password</h1>
      <p className="auth-subheading">We will email you a link to choose a new one.</p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="nx-field">
          <label htmlFor="reset-email" className="nx-label">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            className="nx-input"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div className="nx-alert nx-alert--error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="nx-btn nx-btn--primary nx-btn--lg nx-btn--block" disabled={loading}>
          {loading && <span className="nx-spinner" aria-hidden="true" />}
          {loading ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-footer">
        Remembered it?{' '}
        <Link href="/auth/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </>
  );
}
