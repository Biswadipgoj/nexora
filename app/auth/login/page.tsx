'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Sign in');

  useEffect(() => {
    // Prefetch dashboard in background so post-auth transition is instant
    try {
      router.prefetch('/dashboard');
    } catch {}
  }, [router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLoadingText('Verifying credentials...');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setLoading(false);
        setLoadingText('Sign in');
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email address before signing in. Check your inbox for the verification link.');
        } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(authError.message);
        }
        return;
      }

      setLoadingText('Launching workspace...');
      router.refresh();
      router.replace('/dashboard');

      // Safety fallback to guarantee navigation occurs smoothly
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 750);
    } catch (err: unknown) {
      setLoading(false);
      setLoadingText('Sign in');
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Cannot connect to authentication service. Please check your network connection.');
      } else {
        setError(msg || 'Could not connect to authentication service. Please try again.');
      }
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
      }
    } catch {
      setError('Could not connect with authentication provider. Please try again.');
    }
  }

  return (
    <div className="login-card">
      {/* Mobile Branding */}
      <div className="login-card__mobile-brand" style={{ display: 'flex', justifyContent: 'center' }}>
        <Logo size="md" withText animated />
      </div>

      <div className="login-card__header">
        <h2 className="login-card__title">Sign in</h2>
        <p className="login-card__subtitle">Enter your email and password to access your workspace.</p>
      </div>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2.5,
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            borderRadius: 2,
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </Alert>
      )}

      {/* OAuth Options */}
      <div className="login-oauth-stack">
        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
          sx={{
            py: 1,
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            color: '#0F172A',
            fontSize: '0.8125rem',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
            '&:hover': {
              backgroundColor: '#F8F9FA',
              borderColor: '#D1D5DB',
            },
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleOAuthLogin('github')}
          disabled={loading}
          sx={{
            py: 1,
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            color: '#0F172A',
            fontSize: '0.8125rem',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
            '&:hover': {
              backgroundColor: '#F8F9FA',
              borderColor: '#D1D5DB',
            },
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 10 }}>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Continue with GitHub
        </Button>
      </div>

      <div className="login-divider">
        <span>or sign in with credentials</span>
      </div>

      {/* Email Password Form */}
      <form onSubmit={handleEmailLogin} className="login-form">
        <TextField
          type="email"
          label="Work email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          variant="outlined"
          disabled={loading}
          slotProps={{ inputLabel: { sx: { color: '#64748B' } } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              '& fieldset': { borderColor: '#E5E7EB' },
              '&:hover fieldset': { borderColor: '#CBD5E1' },
              '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1.5 },
            },
          }}
        />

        <TextField
          type="password"
          label="Password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          variant="outlined"
          disabled={loading}
          slotProps={{ inputLabel: { sx: { color: '#64748B' } } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              '& fieldset': { borderColor: '#E5E7EB' },
              '&:hover fieldset': { borderColor: '#CBD5E1' },
              '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1.5 },
            },
          }}
        />

        <div className="login-forgot-row">
          <Link href="/auth/forgot-password" className="login-link">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            py: 1.15,
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <CircularProgress size={16} color="inherit" />
              <span>{loadingText}</span>
            </div>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="login-footer">
        <span>Don&apos;t have an account? </span>
        <Link href="/auth/signup" className="login-link login-link--bold">
          Create account
        </Link>
      </div>

      <style>{`
        .login-card {
          background-color: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        }

        .login-card__mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        @media (min-width: 1024px) {
          .login-card__mobile-brand {
            display: none;
          }
        }

        .login-card__header {
          margin-bottom: 24px;
        }

        .login-card__title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.015em;
        }

        .login-card__subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
          line-height: 1.45;
        }

        .login-oauth-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .login-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: #94A3B8;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #E5E7EB;
        }

        .login-divider span {
          padding: 0 10px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .login-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -6px;
        }

        .login-link {
          color: #2563EB;
          font-size: 0.8125rem;
          text-decoration: none;
          transition: color 120ms ease;
        }

        .login-link:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        .login-link--bold {
          font-weight: 600;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #F1F3F5;
          font-size: 0.8125rem;
          color: #64748B;
        }
      `}</style>
    </div>
  );
}
