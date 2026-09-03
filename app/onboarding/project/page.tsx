'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Project Onboarding Page.
 * §5 J2: Creating a first project.
 * "pick a template (Software / Marketing / Personal / Blank) -> land directly on a working board."
 * Key moment: NO scheme, workflow or permission screen appears before the first work item is created.
 */
export default function CreateProjectPage() {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadWorkspace() {
      const supabase = createClient();
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, name')
        .limit(1);

      if (workspaces && workspaces.length > 0) {
        setWorkspaceId(workspaces[0].id);
      }
    }
    loadWorkspace();
  }, []);

  function handleNameChange(val: string) {
    setName(val);
    if (!key || key.length <= 4) {
      // Auto-generate key from name: take first letters or first 3-4 chars uppercase
      const words = val.trim().split(/\s+/);
      let autoKey = '';
      if (words.length > 1) {
        autoKey = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
      } else {
        autoKey = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
      }
      setKey(autoKey);
    }
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

      // Land directly on working board (Journey J2)
      router.push(`/projects/${data.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="new-proj-page">
      <div className="new-proj-container">
        <header className="new-proj-header">
          <a href="/dashboard" className="new-proj-back">
            ← Dashboard
          </a>
          <h1>Create a new project</h1>
          <p>Get your team or personal work organized in seconds.</p>
        </header>

        {error && (
          <div className="new-proj-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="new-proj-form">
          <div className="new-proj-field">
            <label htmlFor="proj-name">Project name</label>
            <input
              id="proj-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Mobile App, Product Launch, Household"
              required
              autoFocus
              maxLength={100}
              className="new-proj-input"
            />
          </div>

          <div className="new-proj-field">
            <label htmlFor="proj-key">
              Project key
              <span className="new-proj-hint">(Used for work item identifiers like {key ? `${key}-1` : 'NEX-1'})</span>
            </label>
            <input
              id="proj-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="e.g. APP, PROD, HOME"
              required
              maxLength={10}
              className="new-proj-input"
              style={{ letterSpacing: '0.05em', fontWeight: 600 }}
            />
          </div>

          <div className="new-proj-field">
            <label htmlFor="proj-desc">Description (optional)</label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project's purpose..."
              rows={3}
              maxLength={1000}
              className="new-proj-textarea"
            />
          </div>

          <div className="new-proj-field">
            <label>Complexity mode</label>
            <div className="new-proj-modes">
              <label
                className={`new-proj-mode-card ${mode === 'simple' ? 'new-proj-mode-card--active' : ''}`}
                onClick={() => setMode('simple')}
              >
                <input
                  type="radio"
                  name="complexity-mode"
                  value="simple"
                  checked={mode === 'simple'}
                  onChange={() => setMode('simple')}
                />
                <div>
                  <strong>Simple Mode (Default)</strong>
                  <p>Streamlined status board, no scheme configuration or unnecessary friction.</p>
                </div>
              </label>

              <label
                className={`new-proj-mode-card ${mode === 'advanced' ? 'new-proj-mode-card--active' : ''}`}
                onClick={() => setMode('advanced')}
              >
                <input
                  type="radio"
                  name="complexity-mode"
                  value="advanced"
                  checked={mode === 'advanced'}
                  onChange={() => setMode('advanced')}
                />
                <div>
                  <strong>Advanced Mode</strong>
                  <p>Includes sprint planning, backlog management, and estimation features.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="new-proj-actions">
            <a href="/dashboard" className="new-proj-btn-cancel">
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading || !name.trim() || !key.trim() || !workspaceId}
              className="new-proj-btn-submit"
            >
              {loading ? 'Creating project...' : 'Create & Open Board →'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .new-proj-page {
          min-height: 100vh;
          background: var(--color-bg);
          padding: var(--space-10) var(--space-6);
          display: flex;
          justify-content: center;
        }

        .new-proj-container {
          width: 100%;
          max-width: 580px;
        }

        .new-proj-header {
          margin-bottom: var(--space-8);
        }

        .new-proj-back {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          display: inline-block;
          margin-bottom: var(--space-4);
          text-decoration: none;
        }

        .new-proj-back:hover {
          color: var(--color-text-primary);
        }

        .new-proj-header h1 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .new-proj-header p {
          color: var(--color-text-secondary);
        }

        .new-proj-error {
          padding: var(--space-3) var(--space-4);
          background: var(--color-danger-subtle);
          color: var(--color-danger-text);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-6);
        }

        .new-proj-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
          box-shadow: var(--shadow-sm);
        }

        .new-proj-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .new-proj-field label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .new-proj-hint {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-left: var(--space-2);
          font-weight: var(--font-weight-normal);
        }

        .new-proj-input,
        .new-proj-textarea {
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          transition: border-color var(--transition-fast);
        }

        .new-proj-input:focus,
        .new-proj-textarea:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: var(--shadow-focus);
        }

        .new-proj-modes {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .new-proj-mode-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .new-proj-mode-card:hover {
          border-color: var(--color-border-strong);
        }

        .new-proj-mode-card--active {
          border-color: var(--color-accent);
          background: var(--color-accent-subtle);
        }

        .new-proj-mode-card input {
          margin-top: 4px;
        }

        .new-proj-mode-card strong {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }

        .new-proj-mode-card p {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          line-height: var(--line-height-body);
        }

        .new-proj-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: var(--space-4);
          margin-top: var(--space-2);
        }

        .new-proj-btn-cancel {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          text-decoration: none;
        }

        .new-proj-btn-cancel:hover {
          color: var(--color-text-primary);
        }

        .new-proj-btn-submit {
          padding: var(--space-3) var(--space-6);
          background: var(--color-accent);
          color: var(--color-text-on-primary);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          transition: background var(--transition-fast);
        }

        .new-proj-btn-submit:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }

        .new-proj-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
