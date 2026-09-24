'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DemoEntry, OAuthButtons, PasswordField, describeAuthFailure } from './AuthParts';

const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback_error: 'That sign-in link has expired or was already used. Sign in again, or request a new link.',
  invalid_link: 'That share link is no longer valid.',
};

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    initialError ? CALLBACK_ERRORS[initialError] ?? initialError : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch(next);
  }, [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Entered values are preserved after a recoverable error.
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        const message = authError.message.toLowerCase();
        setError(
          message.includes('email not confirmed')
            ? 'Confirm your email address first — the link is in your inbox.'
            : message.includes('invalid login credentials')
              ? 'That email and password do not match. Check them and try again.'
              : authError.message
        );
        setLoading(false);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(describeAuthFailure(err, 'Could not reach the sign-in service. Try again.'));
    }
  }

  const signupHref = next !== '/dashboard' ? `/auth/signup?next=${encodeURIComponent(next)}` : '/auth/signup';

  return (
    <>
      <h1 className="auth-heading">Sign in</h1>
      <p className="auth-subheading">Welcome back. Pick up where the board left off.</p>

      <OAuthButtons disabled={loading} onError={setError} next={next} />

      <div className="auth-divider">or with email</div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="nx-field">
          <label htmlFor="login-email" className="nx-label">
            Email
          </label>
          <input
            id="login-email"
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

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={loading}
          aside={
            <Link href="/auth/forgot-password" className="auth-link" style={{ fontSize: 'var(--nx-fs-xs)' }}>
              Forgot password?
            </Link>
          }
        />

        {/* Server errors sit directly above the action, where the eye already is. */}
        {error && (
          <div className="nx-alert nx-alert--error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="nx-btn nx-btn--primary nx-btn--lg nx-btn--block" disabled={loading}>
          {loading && <span className="nx-spinner" aria-hidden="true" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer">
        New to Nexora?{' '}
        <Link href={signupHref} className="auth-link">
          Create an account
        </Link>
      </p>

      <DemoEntry disabled={loading} onError={setError} />
    </>
  );
}
