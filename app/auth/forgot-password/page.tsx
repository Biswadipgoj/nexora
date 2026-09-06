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
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Could not send the reset link. Check your connection and try again.');
    } finally {
      setLoading(false);
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
            background: 'var(--nx-blue-soft)',
            border: '1px solid var(--nx-blue-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <MarkEmailReadRoundedIcon sx={{ fontSize: 26, color: 'var(--nx-blue)' }} />
        </div>
        <h1 className="auth-heading">Check your inbox</h1>
        <p className="auth-subheading">
          If an account matches <strong style={{ color: 'var(--nx-text)' }}>{email}</strong>, we sent instructions for
          resetting your password.
        </p>
        <Link href="/auth/login" className="auth-link auth-link--bold">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="auth-heading">Reset your password</h1>
      <p className="auth-subheading">Enter your work email address and we will send you a reset link.</p>

      <form onSubmit={handleReset} className="auth-form" noValidate>
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
              Sending link…
            </span>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      <div className="auth-footer">
        <Link href="/auth/login" className="auth-link auth-link--bold">
          Return to sign in
        </Link>
      </div>
    </>
  );
}
