'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/navigation';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onProjectCreated?: (newProject: { id: string; name: string; key: string; mode: string }) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  workspaceId,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleNameChange(val: string) {
    setName(val);
    // Automatically generate 3-4 char key from project name
    const words = val.trim().split(/\s+/);
    let autoKey = '';
    if (words.length > 1) {
      autoKey = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
    } else {
      autoKey = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    }
    setKey(autoKey);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !key.trim() || !workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim() || undefined,
          mode,
          is_personal: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      if (onProjectCreated) {
        onProjectCreated(data.project);
      }

      onClose();
      // Navigate to the newly created project
      router.push(`/projects/${data.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating project');
    } finally {
      setLoading(false);
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
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
          },
        },
      }}
    >
      {/* Luminous Light Header Graphic */}
      <div style={{ position: 'relative', width: '100%', height: 130, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, var(--nx-blue) 0%, var(--nx-violet) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '18px 24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <FolderOpenRoundedIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Workspace Project
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Create New Project
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
            backgroundColor: 'rgba(0, 0, 0, 0.20)',
            backdropFilter: 'blur(8px)',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.40)' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent sx={{ p: 3 }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(225, 29, 72, 0.10)',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                color: 'var(--nx-red)',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--nx-text)',
                marginBottom: 6,
              }}
            >
              Project Name *
            </label>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. Mobile iOS Client or Customer Portal"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.875rem',
                },
              }}
            />
          </div>

          {/* Project Key */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--nx-text)',
                marginBottom: 6,
              }}
            >
              Project Key * (Task Prefix, e.g. APP-101)
            </label>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. APP"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              required
              slotProps={{
                input: {
                  sx: { fontFamily: 'var(--nx-font-mono, monospace)', fontWeight: 700 },
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.875rem',
                },
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--nx-text-3)', marginTop: 4 }}>
              Must be 2–10 uppercase letters or numbers starting with a letter.
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--nx-text)',
                marginBottom: 6,
              }}
            >
              Description (Optional)
            </label>
            <TextField
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="Brief description of project goals and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8125rem',
                },
              }}
            />
          </div>

          {/* Workflow Mode Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--nx-text)',
                marginBottom: 8,
              }}
            >
              Workflow Template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div
                onClick={() => setMode('simple')}
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  border: `2px solid ${mode === 'simple' ? 'var(--nx-blue)' : 'var(--nx-border)'}`,
                  backgroundColor: mode === 'simple' ? 'var(--nx-blue-soft)' : 'var(--nx-surface-2)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <ViewKanbanRoundedIcon sx={{ color: mode === 'simple' ? 'var(--nx-blue)' : 'var(--nx-text-3)' }} />
                  {mode === 'simple' && <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-blue)' }} />}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--nx-text)' }}>Simple Kanban</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--nx-text-3)', marginTop: 2 }}>
                  Fluid 3-column visual board (To Do, In Progress, Done)
                </div>
              </div>

              <div
                onClick={() => setMode('advanced')}
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  border: `2px solid ${mode === 'advanced' ? 'var(--nx-violet)' : 'var(--nx-border)'}`,
                  backgroundColor: mode === 'advanced' ? 'var(--nx-violet-soft)' : 'var(--nx-surface-2)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <RocketLaunchRoundedIcon sx={{ color: mode === 'advanced' ? 'var(--nx-violet)' : 'var(--nx-text-3)' }} />
                  {mode === 'advanced' && <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-violet)' }} />}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--nx-text)' }}>Advanced Sprints</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--nx-text-3)', marginTop: 2 }}>
                  Backlog management, story points & sprint planning
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                borderColor: 'var(--nx-border)',
                color: 'var(--nx-text-2)',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!name.trim() || !key.trim() || loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                background: 'linear-gradient(135deg, var(--nx-blue) 0%, var(--nx-violet) 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
