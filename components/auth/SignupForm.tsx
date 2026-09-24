'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { createClient } from '@/lib/supabase/client';
import { DemoEntry, OAuthButtons, PasswordField, describeAuthFailure } from './AuthParts';

const MIN_PASSWORD = 8;

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Inline validation below the field, shown once the field has been used.
  const passwordError =
    touchedPassword && password.length > 0 && password.length < MIN_PASSWORD
      ? `Use at least ${MIN_PASSWORD} characters.`
      : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setTouchedPassword(true);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const callback = new URL('/auth/callback', window.location.origin);
      // A new account without an invitation starts by naming its workspace.
      callback.searchParams.set('next', next === '/dashboard' ? '/onboarding' : next);

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: { full_name: fullName.trim(), name: fullName.trim() },
        },
      });

      if (authError) {
        const message = authError.message.toLowerCase();
        setError(
          message.includes('already registered') || message.includes('already exists')
            ? 'An account with this email already exists. Sign in instead.'
            : authError.message
        );
        return;
      }

      // With enumeration protection on, a taken address returns no identities.
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        setError('An account with this email already exists. Sign in instead.');
        return;
      }

      // A session comes back immediately when email confirmation is disabled.
      if (data?.session) {
        router.replace(next === '/dashboard' ? '/onboarding' : next);
        router.refresh();
        return;
      }

      setSent(true);
    } catch (err) {
      setError(describeAuthFailure(err, 'Could not create the account. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-success">
        <span className="auth-success__mark" aria-hidden="true">
          <CheckRoundedIcon sx={{ fontSize: 20 }} />
        </span>
        <h1 className="auth-heading">Check your email</h1>
        <p className="auth-subheading">
          We sent a confirmation link to <strong style={{ color: 'var(--nx-ink)' }}>{email}</strong>. Open it on
          this device to finish setting up your account.
        </p>
        <p className="auth-footer">
          Wrong address?{' '}
          <button type="button" className="auth-link" onClick={() => setSent(false)}>
            Use a different email
          </button>
        </p>
      </div>
    );
  }

  const loginHref = next !== '/dashboard' ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login';

  return (
    <>
      <h1 className="auth-heading">Create your account</h1>
      <p className="auth-subheading">A workspace for your projects, ready in under a minute.</p>

      <OAuthButtons disabled={loading} onError={setError} next={next === '/dashboard' ? '/onboarding' : next} />

      <div className="auth-divider">or with email</div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="nx-field">
          <label htmlFor="signup-name" className="nx-label">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            className="nx-input"
            placeholder="Ada Lovelace"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            disabled={loading}
          />
        </div>

        <div className="nx-field">
          <label htmlFor="signup-email" className="nx-label">
            Work email
          </label>
          <input
            id="signup-email"
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
          id="signup-password"
          label="Password"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouchedPassword(true)}
          autoComplete="new-password"
          disabled={loading}
          error={passwordError}
          help={`At least ${MIN_PASSWORD} characters.`}
        />

        {error && (
          <div className="nx-alert nx-alert--error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="nx-btn nx-btn--primary nx-btn--lg nx-btn--block" disabled={loading}>
          {loading && <span className="nx-spinner" aria-hidden="true" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{' '}
        <Link href={loginHref} className="auth-link">
          Sign in
        </Link>
      </p>

      <DemoEntry disabled={loading} onError={setError} />
    </>
  );
}
