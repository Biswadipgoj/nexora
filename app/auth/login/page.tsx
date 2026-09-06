'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Sign in');
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    // Prefetch the dashboard so the post-auth transition is instant.
    try {
      router.prefetch('/dashboard');
    } catch {}
  }, [router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    // Section 6.2: entered values are preserved after a recoverable error, so
    // nothing here clears `email` or `password`.
    setError(null);
    setLoading(true);
    setLoadingText('Verifying credentials…');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setLoading(false);
        setLoadingText('Sign in');
        const message = authError.message.toLowerCase();
        if (message.includes('email not confirmed')) {
          setError('Confirm your email address before signing in. Check your inbox for the verification link.');
        } else if (message.includes('invalid login credentials')) {
          setError('That email and password do not match. Check them and try again.');
        } else {
          setError(authError.message);
        }
        return;
      }

      setLoadingText('Opening your workspace…');
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setLoading(false);
      setLoadingText('Sign in');
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Cannot reach the authentication service. Check your connection and try again.');
      } else {
        setError(msg || 'Could not reach the authentication service. Try again.');
      }
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) setError(authError.message);
    } catch {
      setError('Could not reach that sign-in provider. Try again, or use your email and password.');
    }
  }

  async function handleDemo() {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/dashboard';
        return;
      }
      setDemoLoading(false);
      setError('Could not start the demo workspace. Try again.');
    } catch {
      setDemoLoading(false);
      setError('Could not start the demo workspace. Check your connection and try again.');
    }
  }

  return (
    <>
      {/* Heading and supporting sentence (section 6.2 order) */}
      <h1 className="auth-heading">Sign in</h1>
      <p className="auth-subheading">Enter your email and password to open your workspace.</p>

      <div className="auth-oauth-stack">
        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleOAuthLogin('google')}
          disabled={loading || demoLoading}
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
          onClick={() => handleOAuthLogin('github')}
          disabled={loading || demoLoading}
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

      <form onSubmit={handleEmailLogin} className="auth-form" noValidate>
        <TextField
          type="email"
          label="Work email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
          disabled={loading || demoLoading}
        />

        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          autoComplete="current-password"
          disabled={loading || demoLoading}
        />

        <div className="auth-recovery-row">
          <Link href="/auth/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>

        {/* Section 6.2: server errors appear in a dismissible alert directly
            above the primary action, where the user is already looking. */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || demoLoading}
          sx={{ py: 1.15, fontSize: '0.875rem', fontWeight: 600 }}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <CircularProgress size={16} color="inherit" />
              {loadingText}
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="auth-footer">
        <span>New to Nexora? </span>
        <Link href="/auth/signup" className="auth-link auth-link--bold">
          Create an account
        </Link>
      </div>

      {/* Demo entry, last (section 6.2) */}
      <div className="auth-demo">
        <button type="button" className="auth-demo__btn" onClick={handleDemo} disabled={loading || demoLoading}>
          {demoLoading ? (
            <CircularProgress size={14} color="inherit" />
          ) : (
            <BoltRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-cyan)' }} />
          )}
          {demoLoading ? 'Preparing workspace…' : 'Explore the demo workspace'}
        </button>
        <span className="auth-demo__hint">Sample project with real data. No sign-up needed.</span>
      </div>
    </>
  );
}
