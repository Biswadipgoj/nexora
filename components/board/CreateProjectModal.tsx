'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useRouter } from 'next/navigation';
import { projectKeyError, PROJECT_KEY_PATTERN, suggestProjectKey } from '@/lib/work/project-key';
import './board.css';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onProjectCreated?: (newProject: { id: string; name: string; key: string; mode: string }) => void;
}

export function CreateProjectModal({ isOpen, onClose, workspaceId, onProjectCreated }: CreateProjectModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyProblem = projectKeyError(key);
  const canSubmit = Boolean(name.trim()) && PROJECT_KEY_PATTERN.test(key) && !loading;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          name: name.trim(),
          key,
          description: description.trim() || undefined,
          mode: 'simple',
          is_personal: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create the project.');

      onProjectCreated?.(data.project);
      onClose();
      router.push(`/projects/${data.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create the project.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="create-project-title">
      <form onSubmit={handleCreate}>
        <div className="nx-sheet-head">
          <div>
            <h2 id="create-project-title" className="nx-sheet-title">
              New project
            </h2>
            <p className="nx-sheet-sub">A board of its own, with a short key for every task.</p>
          </div>
          <button type="button" className="nx-icon-btn" onClick={onClose} aria-label="Close">
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="nx-sheet-body">
          <div className="cp-row">
            <div className="nx-field">
              <label htmlFor="cp-name" className="nx-label">
                Name
              </label>
              <input
                id="cp-name"
                className="nx-input"
                placeholder="Customer portal"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!keyEdited) setKey(suggestProjectKey(e.target.value));
                }}
                maxLength={100}
                autoFocus
                required
              />
            </div>
            <div className="nx-field">
              <label htmlFor="cp-key" className="nx-label">
                Key
              </label>
              <input
                id="cp-key"
                className="nx-input cp-key"
                placeholder="CP"
                value={key}
                onChange={(e) => {
                  setKeyEdited(true);
                  setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
                }}
                aria-invalid={Boolean(keyProblem)}
                aria-describedby="cp-key-help"
                required
              />
            </div>
          </div>
          <p id="cp-key-help" className={keyProblem ? 'nx-field__error' : 'nx-field__help'} style={{ marginTop: -10 }}>
            {keyProblem ?? `Tasks will be numbered ${key || 'KEY'}-1, ${key || 'KEY'}-2, and so on.`}
          </p>

          <div className="nx-field">
            <label htmlFor="cp-desc" className="nx-label">
              Description <span className="nx-label__hint">(optional)</span>
            </label>
            <textarea
              id="cp-desc"
              className="nx-textarea"
              rows={3}
              placeholder="What this project is for, in a sentence or two."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          {error && (
            <div className="nx-alert nx-alert--error" role="alert">
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="nx-sheet-foot">
          <span className="nx-sheet-foot__hint">Starts with To Do, In Progress and Done.</span>
          <div className="nx-sheet-foot__actions">
            <button type="button" className="nx-btn nx-btn--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="nx-btn nx-btn--primary" disabled={!canSubmit}>
              {loading && <span className="nx-spinner" aria-hidden="true" />}
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
