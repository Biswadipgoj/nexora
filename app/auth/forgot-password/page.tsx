'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';

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
      setError('Could not process password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="forgot-card">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <MarkEmailReadRoundedIcon sx={{ fontSize: 26, color: '#2563EB' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Check your inbox
          </h2>
          <p style={{ color: '#475467', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: 20 }}>
            If an account matches <strong>{email}</strong>, we sent instructions to reset your password.
          </p>
          <Link href="/auth/login" className="forgot-link forgot-link--bold">
            ← Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-card">
      <div className="forgot-card__header">
        <h2 className="forgot-card__title">Reset your password</h2>
        <p className="forgot-card__subtitle">Enter your work email address and we will send you a reset link.</p>
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

      <form onSubmit={handleReset} className="forgot-form">
        <TextField
          type="email"
          label="Work email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
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
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Send reset link'}
        </Button>
      </form>

      <div className="forgot-footer">
        <span>Remember your password? </span>
        <Link href="/auth/login" className="forgot-link forgot-link--bold">
          Sign in
        </Link>
      </div>

      <style>{`
        .forgot-card {
          background-color: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        }

        .forgot-card__header {
          margin-bottom: 24px;
        }

        .forgot-card__title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.015em;
        }

        .forgot-card__subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
          line-height: 1.45;
        }

        .forgot-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .forgot-link {
          color: #2563EB;
          font-size: 0.8125rem;
          text-decoration: none;
        }

        .forgot-link:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        .forgot-link--bold {
          font-weight: 600;
        }

        .forgot-footer {
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
