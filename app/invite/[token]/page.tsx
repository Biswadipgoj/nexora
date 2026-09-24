'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { PasswordField } from '@/components/auth/AuthParts';
import { FlowShell } from '@/components/auth/FlowShell';

interface InvitationView {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer' | 'guest';
  project_id: string;
  project_name: string;
  project_key: string;
  invited_by_name?: string;
  expires_at: string;
  accepted_at?: string | null;
}

const ROLE_COPY: Record<InvitationView['role'], string> = {
  admin: 'Admin — manages the project and its people',
  manager: 'Manager — runs the board and invites people',
  member: 'Member — creates and updates tasks',
  viewer: 'Viewer — reads the board',
  guest: 'Guest — sees what is shared with them',
};

type Phase = 'loading' | 'invalid' | 'ready' | 'joining' | 'joined';

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [phase, setPhase] = useState<Phase>('loading');
  const [invitation, setInvitation] = useState<InvitationView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signInInstead, setSignInInstead] = useState(false);

  const nextParam = encodeURIComponent(`/invite/${token}`);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/invitations?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'This invitation is invalid or has expired.');

        let email: string | null = null;
        if (configured) {
          const { data: auth } = await createClient().auth.getUser();
          email = auth.user?.email ?? null;
        }
        if (cancelled) return;
        setInvitation(data.invitation);
        setSessionEmail(email);
        setPhase('ready');
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'This invitation is invalid or has expired.');
        setPhase('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, configured]);

  async function accept(body: Record<string, unknown>) {
    if (!invitation) return;
    setError(null);
    setSignInInstead(false);
    setPhase('joining');

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...body }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSignInInstead(Boolean(data.needsSignIn || data.needsAuth));
        throw new Error(data.error || 'Could not accept the invitation.');
      }

      // A new account is signed in on this device before opening the board.
      if (data.createdAccount && typeof body.password === 'string') {
        await createClient().auth.signInWithPassword({ email: invitation.email, password: body.password });
      }

      setPhase('joined');
      router.replace(data.redirectUrl || '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept the invitation.');
      setPhase('ready');
    }
  }

  const expires = invitation
    ? new Date(invitation.expires_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : '';
  const emailMatches = Boolean(sessionEmail && invitation && sessionEmail.toLowerCase() === invitation.email.toLowerCase());

  return (
    <FlowShell>
      {phase === 'loading' && <p className="auth-subheading">Checking your invitation…</p>}

      {phase === 'invalid' && (
        <>
          <h1 className="auth-heading">This invitation cannot be used</h1>
          <p className="auth-subheading">{loadError} Ask the person who invited you for a new link.</p>
          <div className="flow-actions" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
            <Link href="/auth/login" className="nx-btn nx-btn--secondary">
              Go to sign in
            </Link>
          </div>
        </>
      )}

      {invitation && phase !== 'invalid' && phase !== 'loading' && (
        <>
          <p className="nx-eyebrow">Invitation</p>
          <h1 className="auth-heading" style={{ marginTop: 12 }}>
            Join {invitation.project_name}
          </h1>
          <p className="auth-subheading">
            {invitation.invited_by_name ? `${invitation.invited_by_name} invited you` : 'You were invited'} to work on
            this project in Nexora.
          </p>

          <div className="flow-card">
            <dl className="flow-meta">
              <dt>Project</dt>
              <dd>
                {invitation.project_name} <span className="nx-key">{invitation.project_key}</span>
              </dd>
              <dt>Your role</dt>
              <dd>{ROLE_COPY[invitation.role] ?? invitation.role}</dd>
              <dt>For</dt>
              <dd>{invitation.email}</dd>
              <dt>Expires</dt>
              <dd>{expires}</dd>
            </dl>

            {error && (
              <div className="nx-alert nx-alert--error" role="alert">
                <span>{error}</span>
                {signInInstead && (
                  <Link href={`/auth/login?next=${nextParam}`} className="nx-alert__action">
                    Sign in
                  </Link>
                )}
              </div>
            )}

            {!configured ? (
              <div className="flow-actions">
                <button type="button" className="nx-btn nx-btn--primary" onClick={() => void accept({})} disabled={phase === 'joining'}>
                  {phase === 'joining' && <span className="nx-spinner" aria-hidden="true" />}
                  Open the project
                </button>
              </div>
            ) : sessionEmail && emailMatches ? (
              <div className="flow-actions">
                <button type="button" className="nx-btn nx-btn--primary" onClick={() => void accept({})} disabled={phase === 'joining'}>
                  {phase === 'joining' && <span className="nx-spinner" aria-hidden="true" />}
                  Accept as {sessionEmail}
                </button>
              </div>
            ) : sessionEmail ? (
              <div className="nx-alert nx-alert--info" role="status">
                <span>
                  You are signed in as {sessionEmail}. This invitation is for {invitation.email} — sign out and sign in
                  with that address to accept it.
                </span>
                <a href="/api/auth/signout" className="nx-alert__action">
                  Sign out
                </a>
              </div>
            ) : (
              <form
                className="auth-form"
                style={{ marginTop: 0 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (password.length < 8) {
                    setError('Choose a password of at least 8 characters.');
                    return;
                  }
                  void accept({ password, full_name: fullName.trim() || undefined });
                }}
                noValidate
              >
                <div className="nx-field">
                  <label htmlFor="invite-name" className="nx-label">
                    Your name
                  </label>
                  <input
                    id="invite-name"
                    className="nx-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    placeholder="Priya Rao"
                  />
                </div>
                <PasswordField
                  id="invite-password"
                  label="Choose a password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  help="At least 8 characters. You will use it to sign in."
                />
                <div className="flow-actions">
                  <button type="submit" className="nx-btn nx-btn--primary nx-btn--block nx-btn--lg" disabled={phase === 'joining'}>
                    {phase === 'joining' && <span className="nx-spinner" aria-hidden="true" />}
                    {phase === 'joining' ? 'Joining…' : 'Create account and join'}
                  </button>
                </div>
                <p className="auth-footer" style={{ marginTop: 0 }}>
                  Already have an account?{' '}
                  <Link href={`/auth/login?next=${nextParam}`} className="auth-link">
                    Sign in to accept
                  </Link>
                </p>
              </form>
            )}
          </div>
        </>
      )}
    </FlowShell>
  );
}
