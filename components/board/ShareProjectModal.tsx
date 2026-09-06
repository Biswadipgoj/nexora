'use client';

import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import Avatar from '@mui/material/Avatar';
import Image from 'next/image';

export interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectKey: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: 'active' | 'invited';
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

export function ShareProjectModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectKey,
}: ShareProjectModalProps) {
  const [copied, setCopied] = useState(false);
  /**
   * Empty until a link for THIS project is created or fetched.
   *
   * It used to default to the literal 'app', which is a pre-seeded demo link
   * pointing at the sample project — so "Copy link" handed out a link to the
   * wrong board no matter which project was open.
   */
  const [shortCode, setShortCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [inviteRole, setInviteRole] = useState('contributor');
  const [collaborators, setCollaborators] = useState<TeamMember[]>(INITIAL_COLLABORATORS);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  /** Fetch or create this project's own link when the dialog opens. */
  useEffect(() => {
    if (!isOpen || !projectId) return;
    let cancelled = false;

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
  }, [isOpen, projectId]);

  const fullShortUrl = shortCode ? `${origin || ''}/s/${shortCode}` : '';

  function handleCopy() {
    if (!fullShortUrl) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullShortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
          role: inviteRole,
        }),
      });

      // A rejected alias used to fail silently — the `if (res.ok)` had no else,
      // so nothing changed and nothing was said (section 3.4).
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setLinkError(payload?.error ?? 'That link name is not available. Try another.');
        return;
      }

      const data = await res.json();
      setShortCode(data?.shortLink?.code ?? shortCode);
      setCustomAlias('');
      setLinkError(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: 'var(--nx-surface)',
            border: '1px solid var(--nx-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          },
        },
      }}
    >
      {/* 3D Header Graphic Banner */}
      <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--nx-violet), var(--nx-violet))' }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.50) 0%, rgba(0, 0, 0, 0.50) 100%)',
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
                  color: 'var(--nx-violet)',
                  background: 'var(--nx-surface-2)',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  textTransform: 'uppercase',
                }}
              >
                Project Sharing
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--nx-border)' }}>Key: {projectKey}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--nx-on-accent)', margin: 0 }}>
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
            color: 'var(--nx-on-accent)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent sx={{ p: 3 }}>
        {/* Short Link Section */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--nx-text)',
              marginBottom: 8,
            }}
          >
            Direct Short Link (Instant Access)
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
                fontSize: '0.875rem',
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
              onClick={handleCopy}
              startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
              sx={{
                background: copied ? 'var(--nx-green)' : 'linear-gradient(135deg, var(--nx-violet), var(--nx-violet))',
                color: 'var(--nx-on-accent)',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'none',
                px: 2,
                py: 0.7,
                boxShadow: copied ? '0 2px 8px rgba(87, 211, 154, 0.3)' : '0 2px 8px rgba(155, 140, 255, 0.25)',
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--nx-text-3)', marginTop: 6, margin: '6px 0 0 0' }}>
            Recipients clicking this link enter the board with interactive collaborator access.
          </p>
        </div>

        {/* Custom Slug Generator */}
        <form onSubmit={handleCreateCustomLink} style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--nx-text-2)',
              marginBottom: 6,
            }}
          >
            Create Custom Short Alias (e.g. /s/team-mobile)
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

        <div style={{ height: 1, backgroundColor: 'var(--nx-surface-2)', marginBottom: 20 }} />

        {/* Section 3.5: a control must not claim to do something it does not do.
            The email field here pushed a name into local state and rendered
            "Invitation sent successfully" without issuing any request — there is
            no invite endpoint and no membership query anywhere in this codebase.
            Rather than fake it, the panel states what sharing actually does. */}
        {linkError && <p className="share-error" role="alert">{linkError}</p>}

        <div className="share-note">
          <p className="share-note__title">Sharing by link</p>
          <p className="share-note__body">
            Anyone with the link above can open this board. Email invitations and member roles are
            not available yet.
          </p>
        </div>

        {/* Active Collaborators */}
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
                  <div
                    style={{
                      position: 'relative',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '1.5px solid var(--nx-violet)',
                    }}
                  >
                    <Avatar sx={{ width: '100%', height: '100%', bgcolor: 'var(--nx-violet)', fontSize: '0.875rem' }}>
                      {m.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase()}
                    </Avatar>
                  </div>
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
