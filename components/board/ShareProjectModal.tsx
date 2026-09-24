'use client';

import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Avatar } from '@/components/ui/Marks';
import './board.css';

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
  role: string;
}

type InviteRole = 'admin' | 'manager' | 'member' | 'viewer';

interface ProjectInvitation {
  id: string;
  email: string;
  role: InviteRole;
  token: string;
  expires_at: string;
}

/**
 * There is no membership list to show: no endpoint in this codebase reads
 * `project_members` for display, so the honest list is empty until one exists.
 * (It used to be seeded with invented collaborators shown on every project.)
 */
const INITIAL_COLLABORATORS: TeamMember[] = [];

const ROLE_OPTIONS: Array<{ value: InviteRole; label: string; description: string }> = [
  { value: 'member', label: 'Member', description: 'Creates and updates tasks' },
  { value: 'viewer', label: 'Viewer', description: 'Reads the board' },
  { value: 'manager', label: 'Manager', description: 'Runs the board and invites people' },
  { value: 'admin', label: 'Admin', description: 'Manages the project and its people' },
];

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareProjectModal({ isOpen, onClose, ...rest }: ShareProjectModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="share-title">
      {isOpen && <ShareContent onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function ShareContent({
  onClose,
  projectId,
  projectName,
  projectKey,
  workspaceId,
}: Omit<ShareProjectModalProps, 'isOpen'>) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [collaborators] = useState<TeamMember[]>(INITIAL_COLLABORATORS);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('member');
  const [creating, setCreating] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{ email: string; url: string } | null>(null);

  const [pendingInvites, setPendingInvites] = useState<ProjectInvitation[]>([]);
  const [canManage, setCanManage] = useState(true);

  const [shortCode, setShortCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Load pending invitations and this project's share link once per opening.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/invitations?projectId=${encodeURIComponent(projectId)}`);
        if (cancelled) return;
        if (res.status === 403) setCanManage(false);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setPendingInvites(data.invitations ?? []);
        }
      } catch {
        // The list is a convenience; creating an invite still works.
      }
    })();

    (async () => {
      try {
        const existing = await fetch(`/api/shorten?projectId=${encodeURIComponent(projectId)}`);
        if (existing.ok) {
          const data = await existing.json();
          const code = data?.links?.[0]?.code;
          if (code) {
            if (!cancelled) setShortCode(code);
            return;
          }
        }
        const created = await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, workspaceId, role: 'viewer' }),
        });
        if (!created.ok) throw new Error(String(created.status));
        const payload = await created.json();
        if (!cancelled) setShortCode(payload?.shortLink?.code ?? '');
      } catch {
        if (!cancelled) setLinkError('Could not prepare a share link. Try again later.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, workspaceId]);

  const shareUrl = shortCode ? `${origin}/s/${shortCode}` : '';

  async function copy(text: string, id: string) {
    if (await copyText(text)) {
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Enter a valid email address.');
      return;
    }

    setCreating(true);
    setInviteError(null);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, project_id: projectId, email, role: inviteRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create the invitation.');

      const url = data.inviteUrl || `${origin}/invite/${data.invitation.token}`;
      setLastInvite({ email, url });
      setInviteEmail('');
      setPendingInvites((prev) => [data.invitation, ...prev.filter((inv) => inv.id !== data.invitation.id)]);
      void copy(url, 'last');
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Could not create the invitation.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      const res = await fetch(`/api/invitations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) setPendingInvites((prev) => prev.filter((i) => i.id !== id));
      else setInviteError('Could not revoke that invitation.');
    } catch {
      setInviteError('Could not revoke that invitation.');
    }
  }

  async function handleAlias(e: React.FormEvent) {
    e.preventDefault();
    if (!customAlias.trim()) return;
    setSavingAlias(true);
    setLinkError(null);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, workspaceId, customAlias: customAlias.trim(), role: 'viewer' }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setLinkError(payload?.error ?? 'That link name is not available. Try another.');
        return;
      }
      setShortCode(payload?.shortLink?.code ?? shortCode);
      setCustomAlias('');
    } catch {
      setLinkError('Could not save that link name. Check your connection.');
    } finally {
      setSavingAlias(false);
    }
  }

  return (
    <>
      <div className="nx-sheet-head">
        <div>
          <h2 id="share-title" className="nx-sheet-title">
            Share {projectName}
          </h2>
          <p className="nx-sheet-sub">
            <span className="nx-key">{projectKey}</span> · Invite teammates or share a read-only link.
          </p>
        </div>
        <button type="button" className="nx-icon-btn" onClick={onClose} aria-label="Close">
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="nx-sheet-body">
        {canManage && (
          <section className="share-section" aria-labelledby="share-invite-title">
            <h3 id="share-invite-title" className="share-section__title">
              Invite by email
            </h3>
            <p className="share-section__desc">
              Creates a private link for that address. Nexora does not send email yet — the link is copied for you
              to send.
            </p>
            <form className="share-invite" onSubmit={handleCreateInvite} noValidate>
              <label htmlFor="share-email" className="nx-visually-hidden">
                Email address
              </label>
              <input
                id="share-email"
                type="email"
                className="nx-input"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="off"
              />
              <label htmlFor="share-role" className="nx-visually-hidden">
                Role
              </label>
              <select
                id="share-role"
                className="nx-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as InviteRole)}
                title={ROLE_OPTIONS.find((r) => r.value === inviteRole)?.description}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="nx-btn nx-btn--primary" disabled={creating || !inviteEmail.trim()}>
                {creating && <span className="nx-spinner" aria-hidden="true" />}
                Create link
              </button>
            </form>
            <p className="nx-field__help" style={{ marginTop: -4 }}>
              {ROLE_OPTIONS.find((r) => r.value === inviteRole)?.label}s{' '}
              {ROLE_OPTIONS.find((r) => r.value === inviteRole)?.description.replace(/^\w/, (c) => c.toLowerCase())}.
            </p>

            {inviteError && (
              <div className="nx-alert nx-alert--error" role="alert">
                <span>{inviteError}</span>
              </div>
            )}

            {lastInvite && (
              <div className="nx-alert nx-alert--success" role="status">
                <span>
                  Invite link for <strong>{lastInvite.email}</strong>{' '}
                  {copied === 'last' ? 'copied to your clipboard.' : 'is ready.'}
                </span>
                <button type="button" className="nx-alert__action" onClick={() => void copy(lastInvite.url, 'last')}>
                  {copied === 'last' ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            {pendingInvites.length > 0 && (
              <div className="share-list" aria-label="Pending invitations">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="share-row">
                    <Avatar name={invite.email} />
                    <div className="share-row__main">
                      <span className="share-row__email">{invite.email}</span>
                      <span className="share-row__meta">
                        {ROLE_OPTIONS.find((r) => r.value === invite.role)?.label ?? invite.role} · pending · expires{' '}
                        {new Date(invite.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="nx-btn nx-btn--ghost nx-btn--sm"
                      onClick={() => void copy(`${origin}/invite/${invite.token}`, invite.id)}
                    >
                      {copied === invite.id ? 'Copied' : 'Copy link'}
                    </button>
                    <button
                      type="button"
                      className="nx-btn nx-btn--ghost nx-btn--sm"
                      onClick={() => void handleRevoke(invite.id)}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="share-section" aria-labelledby="share-link-title">
          <h3 id="share-link-title" className="share-section__title">
            Read-only link
          </h3>
          <p className="share-section__desc">Anyone with the link can open this board. Members still need an invite to edit.</p>
          <div className="share-link">
            <span className="share-link__url">{shareUrl || 'Preparing link…'}</span>
            <button
              type="button"
              className="nx-btn nx-btn--secondary nx-btn--sm"
              onClick={() => void copy(shareUrl, 'share')}
              disabled={!shareUrl}
            >
              {copied === 'share' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <form className="share-alias" onSubmit={handleAlias}>
            <label htmlFor="share-alias" className="nx-visually-hidden">
              Custom link name
            </label>
            <div className="share-alias__prefix">
              <span aria-hidden="true">/s/</span>
              <input
                id="share-alias"
                className="nx-input"
                placeholder="team-mobile"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value.toLowerCase())}
                maxLength={40}
              />
            </div>
            <button type="submit" className="nx-btn nx-btn--secondary" disabled={!customAlias.trim() || savingAlias}>
              Rename link
            </button>
          </form>
          {linkError && (
            <p className="nx-field__error" role="alert">
              {linkError}
            </p>
          )}
        </section>

        {collaborators.length > 0 && (
          <section className="share-section" aria-labelledby="share-members-title">
            <h3 id="share-members-title" className="share-section__title">
              Members
            </h3>
            <div className="share-list">
              {collaborators.map((m) => (
                <div key={m.id} className="share-row">
                  <Avatar name={m.name} />
                  <div className="share-row__main">
                    <span className="share-row__email">{m.name}</span>
                    <span className="share-row__meta">{m.email}</span>
                  </div>
                  <span className="nx-chip">{m.role}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
