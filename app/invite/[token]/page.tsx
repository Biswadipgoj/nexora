'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Logo } from '@/components/ui/Logo';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

interface InvitationData {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  workspace_id: string;
  project_id?: string;
  invited_by_name?: string;
  expires_at: string;
  accepted_at?: string | null;
}

const ROLE_INFO = {
  admin: {
    title: 'Admin',
    description: 'Full workspace and project configuration authority',
    color: 'var(--nx-violet)',
    bg: 'rgba(124, 58, 237, 0.08)',
  },
  manager: {
    title: 'Project Manager',
    description: 'Manage sprints, workflows, milestones, and task assignments',
    color: 'var(--nx-cyan)',
    bg: 'rgba(8, 145, 178, 0.08)',
  },
  member: {
    title: 'Contributor / Member',
    description: 'Create, update, comment, and resolve work items and tasks',
    color: 'var(--nx-green)',
    bg: 'rgba(5, 150, 105, 0.08)',
  },
  viewer: {
    title: 'Viewer',
    description: 'Read-only access to view boards, roadmaps, and progress',
    color: 'var(--nx-amber)',
    bg: 'rgba(217, 119, 6, 0.08)',
  },
};

export default function InviteAcceptPage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Sign up with password form state ("need to sign up via pas")
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/invitations?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'This invitation is invalid or expired.');
        }
        setInvitation(data.invitation);
      } catch (err: unknown) {
        setFetchError(err instanceof Error ? err.message : 'Invalid invitation link.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvitation();
    }
  }, [token]);

  async function handleAcceptWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          full_name: fullName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation.');
      }

      setIsSuccess(true);
      // Brief pause to show celebration then redirect
      setTimeout(() => {
        router.push(data.redirectUrl || '/dashboard');
      }, 1200);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Could not accept invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--nx-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Aurora Mesh Gradients */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '500px',
          background: 'radial-gradient(ellipse, rgba(124, 58, 237, 0.07) 0%, rgba(8, 145, 178, 0.05) 50%, transparent 80%)',
          pointerEvents: 'none',
          filter: 'blur(60px)',
        }}
      />

      {/* Main Glassmorphic Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          backgroundColor: 'var(--nx-surface)',
          border: '1px solid var(--nx-border)',
          borderRadius: 20,
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 1px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top Iridescent Banner */}
        <div
          style={{
            height: 8,
            width: '100%',
            background: 'linear-gradient(90deg, #4338CA 0%, #7C3AED 50%, #0891B2 100%)',
          }}
        />

        <div style={{ padding: '36px 32px' }}>
          {/* Logo Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Logo />
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CircularProgress size={32} sx={{ color: 'var(--nx-violet)', mb: 2 }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--nx-text-3)', fontWeight: 500 }}>
                Verifying your invitation credentials...
              </p>
            </div>
          )}

          {fetchError && !loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(225, 29, 72, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <ErrorOutlineRoundedIcon sx={{ fontSize: 28, color: 'var(--nx-rose)' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--nx-text)', margin: '0 0 8px' }}>
                Invalid or Expired Invite
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--nx-text-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
                {fetchError}
              </p>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                <Button
                  variant="outlined"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  Go to Sign In
                </Button>
              </Link>
            </div>
          )}

          {isSuccess && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(5, 150, 105, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircleRoundedIcon sx={{ fontSize: 32, color: 'var(--nx-green)' }} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--nx-text)', margin: '0 0 8px' }}>
                Welcome aboard!
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--nx-text-3)', margin: 0 }}>
                Your account is active and you are entering the project workspace now...
              </p>
            </div>
          )}

          {invitation && !loading && !fetchError && !isSuccess && (
            <div>
              {/* Invitation Context Card */}
              <div
                style={{
                  backgroundColor: 'var(--nx-surface-2)',
                  border: '1px solid var(--nx-border)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--nx-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Project Authorization
                  </span>
                  <Chip
                    label={ROLE_INFO[invitation.role]?.title.toUpperCase()}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.6875rem',
                      color: ROLE_INFO[invitation.role]?.color,
                      backgroundColor: ROLE_INFO[invitation.role]?.bg,
                      borderRadius: 1.5,
                      border: `1px solid ${ROLE_INFO[invitation.role]?.color}33`,
                    }}
                  />
                </div>

                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--nx-text)' }}>
                  You are invited to collaborate
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--nx-text-2)', lineHeight: 1.45 }}>
                  {ROLE_INFO[invitation.role]?.description}
                </p>
                {invitation.invited_by_name && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--nx-text-3)' }}>
                    Invited by <strong>{invitation.invited_by_name}</strong>
                  </p>
                )}
              </div>

              {/* Sign Up via Password Form */}
              <form onSubmit={handleAcceptWithPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--nx-text)',
                      marginBottom: 6,
                    }}
                  >
                    Invited Email Address
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    value={invitation.email}
                    disabled
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlinedIcon sx={{ fontSize: 18, color: 'var(--nx-text-3)' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      backgroundColor: 'var(--nx-surface-2)',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--nx-text)',
                      marginBottom: 6,
                    }}
                  >
                    Your Full Name
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    placeholder="e.g. Maya Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-text-3)' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--nx-text)',
                      marginBottom: 6,
                    }}
                  >
                    Create Account Password
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ fontSize: 18, color: 'var(--nx-text-3)' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--nx-text-3)', marginTop: 4 }}>
                    Your password securely signs you in to manage your tasks and projects.
                  </span>
                </div>

                {submitError && (
                  <p
                    role="alert"
                    style={{
                      margin: 0,
                      fontSize: '0.78125rem',
                      fontWeight: 600,
                      color: 'var(--nx-rose)',
                      backgroundColor: 'rgba(225, 29, 72, 0.08)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(225, 29, 72, 0.2)',
                    }}
                  >
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting || password.length < 8}
                  endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRoundedIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, var(--nx-violet) 0%, #4338CA 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    textTransform: 'none',
                    py: 1.25,
                    borderRadius: 2.5,
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6D28D9 0%, #3730A3 100%)',
                    },
                  }}
                >
                  {submitting ? 'Setting up account...' : 'Sign Up with Password & Join'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <p style={{ marginTop: 24, fontSize: '0.75rem', color: 'var(--nx-text-3)', textAlign: 'center' }}>
        NEXORA • Modern Agile Super App • Real-time Collaboration
      </p>
    </div>
  );
}
