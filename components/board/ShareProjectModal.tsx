'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import Avatar from '@mui/material/Avatar';

export interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectKey: string;
  workspaceId?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: 'active' | 'invited';
}

interface ProjectInvitation {
  id: string;
  workspace_id: string;
  project_id?: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  token: string;
  created_at: string;
  expires_at: string;
}

/**
 * There is no membership list to show.
 *
 * This used to be seeded with "Alex Morgan" and "Sarah Chen", who were rendered
 * as members of every project for every user — invented people presented as
 * real collaborators. No endpoint or query in this codebase reads
 * `workspace_members` or `project_members`, so the honest list is empty until
 * one exists.
 */
const INITIAL_COLLABORATORS: TeamMember[] = [];

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full workspace & project authorization',
    color: 'var(--nx-violet)',
  },
  {
    value: 'manager',
    label: 'Project Manager',
    description: 'Manage sprints, backlog, workflows & assignees',
    color: 'var(--nx-cyan)',
  },
  {
    value: 'member',
    label: 'Contributor / Member',
    description: 'Create, update and resolve tasks & issues',
    color: 'var(--nx-green)',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only view of boards & metrics',
    color: 'var(--nx-amber)',
  },
] as const;

export function ShareProjectModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectKey,
  workspaceId = 'b0000000-0000-4000-8000-000000000001',
}: ShareProjectModalProps) {
  // Direct Shortlink State
  const [copiedShort, setCopiedShort] = useState(false);
  const [shortCode, setShortCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [collaborators] = useState<TeamMember[]>(INITIAL_COLLABORATORS);
  const [origin, setOrigin] = useState('');

  // Email Invitation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member' | 'viewer'>('member');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [lastGeneratedInviteUrl, setLastGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(false);

  // Active / Pending Invitations State
  const [pendingInvites, setPendingInvites] = useState<ProjectInvitation[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchProjectInvites = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingInvites(true);
    try {
      const res = await fetch(`/api/invitations?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data = await res.json();
        setPendingInvites(data.invitations || []);
      }
    } catch {
      // Best-effort fetching
    } finally {
      setIsLoadingInvites(false);
    }
  }, [projectId]);

  // Fetch or create this project's direct link and load existing invitations
  useEffect(() => {
    if (!isOpen || !projectId) return;
    let cancelled = false;

    fetchProjectInvites();

    (async () => {
      setLinkError(null);
      try {
        const existing = await fetch(`/api/shorten?projectId=${encodeURIComponent(projectId)}`);
        if (existing.ok) {
          const data = await existing.json();
          const link = data?.links?.[0];
          if (link?.code && !cancelled) {
            setShortCode(link.code);
            return;
          }
        }

        const created = await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, role: 'viewer' }),
        });
        if (!created.ok) throw new Error(String(created.status));
        const payload = await created.json();
        if (!cancelled) setShortCode(payload?.shortLink?.code ?? '');
      } catch {
        if (!cancelled) setLinkError('Could not prepare a share link. Try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId, fetchProjectInvites]);

  const fullShortUrl = shortCode ? `${origin || ''}/s/${shortCode}` : '';

  function handleCopyDirect() {
    if (!fullShortUrl) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullShortUrl);
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2500);
    }
  }

  function handleCopyInviteUrl(url: string, tokenId?: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      if (tokenId) {
        setCopiedToken(tokenId);
        setTimeout(() => setCopiedToken(null), 2500);
      } else {
        setCopiedInviteUrl(true);
        setTimeout(() => setCopiedInviteUrl(false), 2500);
      }
    }
  }

  async function handleDispatchInvite(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setDispatchError('Please provide a valid recipient email address.');
      return;
    }

    setIsDispatching(true);
    setDispatchError(null);
    setDispatchSuccess(null);

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          email: cleanEmail,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch invitation');
      }

      const inviteUrl = data.inviteUrl || `${origin}/invite/${data.invitation.token}`;
      setLastGeneratedInviteUrl(inviteUrl);
      setDispatchSuccess(`Invite dispatched to ${cleanEmail} as ${inviteRole.toUpperCase()}.`);
      setInviteEmail('');
      // Prepend to local list
      setPendingInvites((prev) => [data.invitation, ...prev.filter((inv) => inv.id !== data.invitation.id)]);
    } catch (err: unknown) {
      setDispatchError(err instanceof Error ? err.message : 'Failed to dispatch invitation');
    } finally {
      setIsDispatching(false);
    }
  }

  async function handleRevokeInvitation(id: string) {
    try {
      const res = await fetch(`/api/invitations?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPendingInvites((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      // best-effort
    }
  }

  async function handleCreateCustomLink(e: React.FormEvent) {
    e.preventDefault();
    if (!customAlias.trim()) return;

    setIsCreatingCustom(true);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          customAlias: customAlias.trim(),
          role: 'member',
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setLinkError(payload?.error ?? 'That link name is not available. Try another.');
        return;
      }

      const data = await res.json();
      setShortCode(data?.shortLink?.code ?? shortCode);
      setCustomAlias('');
      setLinkError(null);
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2500);
    } catch {
      setLinkError('Could not create that link. Check your connection and try again.');
    } finally {
      setIsCreatingCustom(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            overflow: 'hidden',
            backgroundColor: 'var(--nx-surface)',
            border: '1px solid var(--nx-border)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.16)',
          },
        },
      }}
    >
      {/* Visual Header Graphic Banner */}
      <div style={{ position: 'relative', width: '100%', height: 140, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #0891B2 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '18px 24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '2px 10px',
                  borderRadius: 9999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Project Access & Permissions
              </span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>
                Key: {projectKey}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Share {projectName}
            </h2>
          </div>
        </div>

        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* SECTION 1: Invite Collaborator by Email & Choose Position Authorization */}
        <section
          style={{
            backgroundColor: 'var(--nx-surface-2)',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid var(--nx-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--nx-text)' }}>
                Invite Collaborator by Mail
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78125rem', color: 'var(--nx-text-3)' }}>
                Select authorization role. Invitee will receive an email link to sign up via password.
              </p>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--nx-violet)',
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid var(--nx-violet-line)',
              }}
            >
              Role-Based Access
            </span>
          </div>

          <form onSubmit={handleDispatchInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 10, alignItems: 'center' }}>
              <TextField
                size="small"
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                sx={{
                  backgroundColor: 'var(--nx-surface)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.84rem',
                  },
                }}
              />

              <TextField
                select
                size="small"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                sx={{
                  backgroundColor: 'var(--nx-surface)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.84rem',
                    fontWeight: 600,
                  },
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: opt.color }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--nx-text-3)' }}>
                        {opt.description}
                      </span>
                    </div>
                  </MenuItem>
                ))}
              </TextField>

              <Button
                type="submit"
                variant="contained"
                disabled={isDispatching || !inviteEmail.trim()}
                startIcon={isDispatching ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                sx={{
                  background: 'linear-gradient(135deg, var(--nx-violet), #4338CA)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  textTransform: 'none',
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6D28D9, #3730A3)',
                  },
                }}
              >
                {isDispatching ? 'Inviting...' : 'Send Invite'}
              </Button>
            </div>

            {dispatchError && (
              <p
                role="alert"
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--nx-rose)',
                  backgroundColor: 'rgba(225, 29, 72, 0.08)',
                  padding: '6px 12px',
                  borderRadius: 8,
                }}
              >
                {dispatchError}
              </p>
            )}

            {dispatchSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                  padding: '8px 14px',
                  borderRadius: 8,
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <CheckRoundedIcon sx={{ color: 'var(--nx-green)', fontSize: 18, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'var(--nx-green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dispatchSuccess}
                  </span>
                </div>

                {lastGeneratedInviteUrl && (
                  <Button
                    size="small"
                    onClick={() => handleCopyInviteUrl(lastGeneratedInviteUrl)}
                    startIcon={copiedInviteUrl ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: 'var(--nx-green)',
                      backgroundColor: 'rgba(5, 150, 105, 0.15)',
                      py: 0.3,
                      px: 1.2,
                    }}
                  >
                    {copiedInviteUrl ? 'Copied' : 'Copy Invite Link'}
                  </Button>
                )}
              </div>
            )}
          </form>
        </section>

        {/* SECTION 2: Pending Project Invitations */}
        {pendingInvites.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--nx-text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Pending Invitations ({pendingInvites.length})
              </span>
              {isLoadingInvites && <CircularProgress size={14} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingInvites.map((invite) => {
                const inviteLink = `${origin}/invite/${invite.token}`;
                const isItemCopied = copiedToken === invite.token;
                return (
                  <div
                    key={invite.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      backgroundColor: 'var(--nx-surface-2)',
                      border: '1px solid var(--nx-border)',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(124, 58, 237, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--nx-violet)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          flexShrink: 0,
                        }}
                      >
                        {invite.email.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: 'var(--nx-text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {invite.email}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--nx-text-3)' }}>
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Chip
                        label={invite.role.toUpperCase()}
                        size="small"
                        sx={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor:
                            invite.role === 'admin'
                              ? 'rgba(124, 58, 237, 0.12)'
                              : invite.role === 'manager'
                              ? 'rgba(8, 145, 178, 0.12)'
                              : invite.role === 'member'
                              ? 'rgba(5, 150, 105, 0.12)'
                              : 'rgba(217, 119, 6, 0.12)',
                          color:
                            invite.role === 'admin'
                              ? 'var(--nx-violet)'
                              : invite.role === 'manager'
                              ? 'var(--nx-cyan)'
                              : invite.role === 'member'
                              ? 'var(--nx-green)'
                              : 'var(--nx-amber)',
                          borderRadius: 1.5,
                        }}
                      />

                      <Button
                        size="small"
                        onClick={() => handleCopyInviteUrl(inviteLink, invite.token)}
                        startIcon={isItemCopied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          py: 0.4,
                          px: 1.2,
                          color: isItemCopied ? 'var(--nx-green)' : 'var(--nx-text-2)',
                        }}
                      >
                        {isItemCopied ? 'Copied' : 'Link'}
                      </Button>

                      <IconButton
                        size="small"
                        onClick={() => handleRevokeInvitation(invite.id)}
                        title="Revoke invitation"
                        sx={{ color: 'var(--nx-text-3)', '&:hover': { color: 'var(--nx-rose)' } }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 3: Direct Short Link & Custom Slug */}
        <section
          style={{
            borderTop: '1px solid var(--nx-border)',
            paddingTop: 20,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--nx-text)',
                marginBottom: 8,
              }}
            >
              Direct Link Access
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--nx-surface-2)',
                border: '1.5px solid var(--nx-border)',
                borderRadius: 10,
                padding: '6px 8px 6px 14px',
                gap: 8,
              }}
            >
              <LinkRoundedIcon sx={{ color: 'var(--nx-violet)', fontSize: 20 }} />
              <span
                style={{
                  flex: 1,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--nx-text-2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {fullShortUrl}
              </span>
              <Button
                variant="contained"
                size="small"
                onClick={handleCopyDirect}
                startIcon={copiedShort ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                sx={{
                  background: copiedShort
                    ? 'var(--nx-green)'
                    : 'linear-gradient(135deg, var(--nx-violet), var(--nx-violet))',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  px: 2,
                  py: 0.7,
                  boxShadow: copiedShort
                    ? '0 2px 8px rgba(5, 150, 105, 0.3)'
                    : '0 2px 8px rgba(124, 58, 237, 0.25)',
                }}
              >
                {copiedShort ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Custom Slug Generator */}
          <form onSubmit={handleCreateCustomLink}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--nx-text-2)',
                marginBottom: 6,
              }}
            >
              Custom Short Alias (e.g. /s/team-mobile)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="custom-slug-name"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <span style={{ fontSize: '0.75rem', color: 'var(--nx-text-3)', marginRight: 4 }}>
                        /s/
                      </span>
                    ),
                  },
                }}
                sx={{
                  backgroundColor: 'var(--nx-surface-2)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.8125rem',
                  },
                }}
              />
              <Button
                type="submit"
                variant="outlined"
                size="small"
                disabled={!customAlias.trim() || isCreatingCustom}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  px: 2,
                  borderRadius: 2,
                }}
              >
                Set Alias
              </Button>
            </div>
          </form>

          {linkError && <p style={{ color: 'var(--nx-rose)', fontSize: '0.75rem', marginTop: 8 }} role="alert">{linkError}</p>}
        </section>

        {/* SECTION 4: Active Project Members */}
        <div>
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--nx-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
            }}
          >
            Project Members ({collaborators.length})
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {collaborators.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--nx-surface-2)',
                  border: '1px solid var(--nx-surface-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--nx-violet)', fontSize: '0.875rem' }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--nx-text)' }}>
                      {m.name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--nx-text-3)' }}>
                      {m.email}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Chip
                    label={m.role}
                    size="small"
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--nx-surface-2)',
                      color: 'var(--nx-violet)',
                      border: '1px solid var(--nx-violet-line)',
                    }}
                  />
                  {m.status === 'invited' && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--nx-amber)', fontWeight: 600 }}>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
