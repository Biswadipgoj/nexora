'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  // Section 6.2 — inline validation appears below the field, not as a server
  // round trip. Only shown once the field has been interacted with.
  const passwordError =
    touchedPassword && password.length > 0 && password.length < MIN_PASSWORD
      ? `Use at least ${MIN_PASSWORD} characters.`
      : undefined;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setTouchedPassword(true);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName.trim(), name: fullName.trim() },
        },
      });

      if (authError) {
        const message = authError.message.toLowerCase();
        if (message.includes('already registered') || message.includes('user already exists')) {
          setError('An account with this email already exists. Sign in instead.');
        } else {
          setError(authError.message);
        }
        return;
      }

      // Supabase returns an empty identities array when email enumeration
      // protection is on and the address is already taken.
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        setError('An account with this email already exists. Sign in instead.');
        return;
      }

      // A session comes back immediately when email confirmation is disabled.
      if (data?.session) {
        window.location.href = '/onboarding';
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Cannot reach the authentication service. Check your connection and try again.');
      } else {
        setError(msg || 'Could not complete sign-up. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthSignup(provider: 'google' | 'github') {
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) setError(authError.message);
    } catch {
      setError('Could not reach that sign-in provider. Try again, or use your email.');
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--nx-green-soft)',
            border: '1px solid var(--nx-green-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <CheckCircleRoundedIcon sx={{ fontSize: 26, color: 'var(--nx-green)' }} />
        </div>
        <h1 className="auth-heading">Check your email</h1>
        <p className="auth-subheading">
          We sent an activation link to <strong style={{ color: 'var(--nx-text)' }}>{email}</strong>. Open it to
          confirm your account and get started.
        </p>
        <Link href="/auth/login" className="auth-link auth-link--bold">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="auth-heading">Create your account</h1>
      <p className="auth-subheading">Start organizing projects and tasks with your team.</p>

      <div className="auth-oauth-stack">
        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleOAuthSignup('google')}
          disabled={loading}
          sx={{ py: 1, borderColor: 'var(--nx-border)', color: 'var(--nx-text)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" style={{ marginRight: 10 }} aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleOAuthSignup('github')}
          disabled={loading}
          sx={{ py: 1, borderColor: 'var(--nx-border)', color: 'var(--nx-text)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 10 }} aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub
        </Button>
      </div>

      <div className="auth-divider">
        <span>or use your email</span>
      </div>

      <form onSubmit={handleSignup} className="auth-form" noValidate>
        <TextField
          type="text"
          label="Full name"
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          fullWidth
          autoComplete="name"
          disabled={loading}
        />

        <TextField
          type="email"
          label="Work email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
          disabled={loading}
        />

        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouchedPassword(true)}
          required
          fullWidth
          autoComplete="new-password"
          disabled={loading}
          error={Boolean(passwordError)}
          helperText={passwordError ?? `At least ${MIN_PASSWORD} characters.`}
        />

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ py: 1.15, fontSize: '0.875rem', fontWeight: 600 }}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <CircularProgress size={16} color="inherit" />
              Creating account…
            </span>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <div className="auth-footer">
        <span>Already have an account? </span>
        <Link href="/auth/login" className="auth-link auth-link--bold">
          Sign in
        </Link>
      </div>
    </>
  );
}
