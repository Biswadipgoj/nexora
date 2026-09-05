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
import SendRoundedIcon from '@mui/icons-material/SendRounded';
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

const INITIAL_COLLABORATORS: TeamMember[] = [
  {
    id: 'u1',
    name: 'Alex Morgan',
    email: 'alex@nexora.io',
    avatar: '',
    role: 'Project Lead',
    status: 'active',
  },
  {
    id: 'u2',
    name: 'Sarah Chen',
    email: 'sarah@nexora.io',
    avatar: '',
    role: 'Product Designer',
    status: 'active',
  },
];

export function ShareProjectModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectKey,
}: ShareProjectModalProps) {
  const [copied, setCopied] = useState(false);
  const [shortCode, setShortCode] = useState('app');
  const [customAlias, setCustomAlias] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('contributor');
  const [collaborators, setCollaborators] = useState<TeamMember[]>(INITIAL_COLLABORATORS);
  const [origin, setOrigin] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullShortUrl = origin ? `${origin}/s/${shortCode}` : `http://localhost:3000/s/${shortCode}`;

  function handleCopy() {
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

      if (res.ok) {
        const data = await res.json();
        setShortCode(data.shortLink.code);
        setCustomAlias('');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } finally {
      setIsCreatingCustom(false);
    }
  }

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `u-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      avatar: '',
      role: inviteRole === 'admin' ? 'Admin' : inviteRole === 'viewer' ? 'Viewer' : inviteRole === 'guest' ? 'Guest' : 'Contributor',
      status: 'invited',
    };

    setCollaborators((prev) => [newMember, ...prev]);
    setInviteEmail('');
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
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
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          },
        },
      }}
    >
      {/* 3D Header Graphic Banner */}
      <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.3) 100%)',
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
                  color: '#4F46E5',
                  background: '#EEF2FF',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  textTransform: 'uppercase',
                }}
              >
                Project Sharing
              </span>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Key: {projectKey}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
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
              color: '#0F172A',
              marginBottom: 8,
            }}
          >
            Direct Short Link (Instant Access)
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 10,
              padding: '6px 8px 6px 14px',
              gap: 8,
            }}
          >
            <LinkRoundedIcon sx={{ color: '#6366F1', fontSize: 20 }} />
            <span
              style={{
                flex: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#334155',
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
                background: copied ? '#10B981' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'none',
                px: 2,
                py: 0.7,
                boxShadow: copied ? '0 2px 8px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 6, margin: '6px 0 0 0' }}>
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
              color: '#475467',
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
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginRight: 4 }}>
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

        <div style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 }} />

        {/* Invite by Email */}
        <form onSubmit={handleSendInvite} style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#0F172A',
              marginBottom: 8,
            }}
          >
            Invite Members via Email
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextField
              size="small"
              fullWidth
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8125rem',
                },
              }}
            />
            <TextField
              select
              size="small"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              sx={{
                width: 130,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8125rem',
                },
              }}
            >
              <MenuItem value="contributor">Contributor</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="guest">Guest (Assigned Only)</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={!inviteEmail.trim()}
              startIcon={<SendRoundedIcon fontSize="small" />}
              sx={{
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                px: 2,
                borderRadius: 2,
              }}
            >
              Invite
            </Button>
          </div>
          {inviteSent && (
            <p style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, marginTop: 6, margin: '6px 0 0 0' }}>
              ✓ Invitation sent successfully!
            </p>
          )}
        </form>

        {/* Active Collaborators */}
        <div>
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#64748B',
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
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9',
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
                      border: '1.5px solid #4F46E5',
                    }}
                  >
                    <Avatar sx={{ width: '100%', height: '100%', bgcolor: '#4F46E5', fontSize: '0.875rem' }}>
                      {m.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase()}
                    </Avatar>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                      {m.name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>
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
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      border: '1px solid #C7D2FE',
                    }}
                  />
                  {m.status === 'invited' && (
                    <span style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 600 }}>
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
