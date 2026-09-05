'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Could not complete signup. Please try again.');
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

  if (success) {
    return (
      <div className="signup-card">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 26, color: '#16A34A' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Check your email
          </h2>
          <p style={{ color: '#475467', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: 20 }}>
            We sent an activation link to <strong>{email}</strong>. Click the link in your email to confirm your account and get started.
          </p>
          <Link href="/auth/login" className="signup-link signup-link--bold">
            ← Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-card">
      <div className="signup-card__mobile-brand" style={{ display: 'flex', justifyContent: 'center' }}>
        <Logo size="md" withText animated />
      </div>

      <div className="signup-card__header">
        <h2 className="signup-card__title">Create your account</h2>
        <p className="signup-card__subtitle">Start organizing projects and tasks with your team.</p>
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
      <div className="signup-oauth-stack">
        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleOAuthSignup('google')}
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
      </div>

      <div className="signup-divider">
        <span>or</span>
      </div>

      <form onSubmit={handleSignup} className="signup-form">
        <TextField
          type="text"
          label="Full name"
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          fullWidth
          variant="outlined"
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
          type="email"
          label="Work email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          variant="outlined"
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
          label="Password (8 or more characters)"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          variant="outlined"
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            py: 1.1,
            fontSize: '0.875rem',
          }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Create account'}
        </Button>
      </form>

      <div className="signup-footer">
        <span>Already have an account? </span>
        <Link href="/auth/login" className="signup-link signup-link--bold">
          Sign in
        </Link>
      </div>

      <style>{`
        .signup-card {
          background-color: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        }

        .signup-card__mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        @media (min-width: 1024px) {
          .signup-card__mobile-brand {
            display: none;
          }
        }

        .signup-card__mobile-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #E5E7EB;
          display: flex;
        }

        .signup-card__logo-img {
          object-fit: cover;
        }

        .signup-card__mobile-title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
          color: #0F172A;
        }

        .signup-card__header {
          margin-bottom: 24px;
        }

        .signup-card__title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.015em;
        }

        .signup-card__subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
          line-height: 1.45;
        }

        .signup-oauth-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .signup-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: #94A3B8;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .signup-divider::before,
        .signup-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #E5E7EB;
        }

        .signup-divider span {
          padding: 0 10px;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .signup-link {
          color: #2563EB;
          font-size: 0.8125rem;
          text-decoration: none;
          transition: color 120ms ease;
        }

        .signup-link:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        .signup-link--bold {
          font-weight: 600;
        }

        .signup-footer {
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
