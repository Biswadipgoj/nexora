'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PasswordField, describeAuthFailure } from '@/components/auth/AuthParts';

const MIN_PASSWORD = 8;

/**
 * Choose a new password. Reached from the recovery email via /auth/callback,
 * which has already exchanged the link for a short-lived recovery session.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password ? 'The two passwords do not match.' : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(
          /session/i.test(updateError.message)
            ? 'This reset link has expired. Request a new one to continue.'
            : updateError.message
        );
        setLoading(false);
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(describeAuthFailure(err, 'Could not update your password. Try again.'));
    }
  }

  return (
    <>
      <h1 className="auth-heading">Choose a new password</h1>
      <p className="auth-subheading">You will stay signed in on this device afterwards.</p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={loading}
          help={`At least ${MIN_PASSWORD} characters.`}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={loading}
          error={mismatch}
        />

        {error && (
          <div className="nx-alert nx-alert--error" role="alert">
            <span>{error}</span>
            {/expired/.test(error) && (
              <Link href="/auth/forgot-password" className="nx-alert__action">
                New link
              </Link>
            )}
          </div>
        )}

        <button type="submit" className="nx-btn nx-btn--primary nx-btn--lg nx-btn--block" disabled={loading}>
          {loading && <span className="nx-spinner" aria-hidden="true" />}
          {loading ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </>
  );
}
