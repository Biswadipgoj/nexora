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
                  <strong>Simple (Default)</strong>
                  <p>A simple Kanban board with To Do, In Progress, and Done.</p>
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
                  <strong>Advanced</strong>
                  <p>Adds sprint backlogs, task estimates, and roadmap planning.</p>
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
          background: radial-gradient(at 10% 12%, rgba(155, 140, 255, 0.18) 0px, transparent 45%),
                      radial-gradient(at 90% 15%, rgba(155, 140, 255, 0.15) 0px, transparent 45%),
                      radial-gradient(at 50% 92%, rgba(70, 215, 232, 0.16) 0px, transparent 50%),
                      radial-gradient(at 85% 85%, rgba(168, 85, 247, 0.12) 0px, transparent 45%),
                      var(--nx-surface-2);
          padding: 48px 24px;
          display: flex;
          justify-content: center;
        }

        .new-proj-container {
          width: 100%;
          max-width: 640px;
        }

        .new-proj-header {
          margin-bottom: 28px;
        }

        .new-proj-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--nx-violet);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 16px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .new-proj-back:hover {
          color: var(--nx-violet);
          transform: translateX(-2px);
        }

        .new-proj-header h1 {
          font-family: var(--font-display, inherit);
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--nx-text);
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .new-proj-header p {
          color: var(--nx-text-2);
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .new-proj-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: var(--nx-surface-2);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(155, 140, 255, 0.2);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 20px 40px -15px rgba(155, 140, 255, 0.18),
                      0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        .new-proj-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .new-proj-field label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--nx-text);
        }

        .new-proj-hint {
          font-size: 0.75rem;
          color: var(--nx-text-3);
          margin-left: 8px;
          font-weight: 400;
        }

        .new-proj-input,
        .new-proj-textarea {
          padding: 12px 16px;
          border: 1px solid var(--nx-border);
          border-radius: 10px;
          background: var(--nx-surface);
          color: var(--nx-text);
          font-size: 0.9375rem;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .new-proj-input:focus,
        .new-proj-textarea:focus {
          outline: none;
          border-color: var(--nx-violet);
          box-shadow: 0 0 0 3.5px rgba(155, 140, 255, 0.2);
        }

        .new-proj-modes {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .new-proj-mode-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          border: 1px solid var(--nx-border);
          border-radius: 12px;
          background: var(--nx-surface);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .new-proj-mode-card:hover {
          border-color: var(--nx-violet-line);
          background: var(--nx-surface-2);
        }

        .new-proj-mode-card--active {
          border-color: var(--nx-violet);
          background: linear-gradient(135deg, var(--nx-surface-2) 0%, var(--nx-surface-2) 100%);
          box-shadow: 0 4px 14px rgba(155, 140, 255, 0.12);
        }

        .new-proj-mode-card input {
          margin-top: 4px;
          accent-color: var(--nx-violet);
        }

        .new-proj-mode-card strong {
          display: block;
          font-size: 0.875rem;
          color: var(--nx-text);
          margin-bottom: 3px;
        }

        .new-proj-mode-card p {
          font-size: 0.8125rem;
          color: var(--nx-text-2);
          line-height: 1.5;
        }

        .new-proj-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-top: 8px;
        }

        .new-proj-btn-cancel {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--nx-text-3);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .new-proj-btn-cancel:hover {
          color: var(--nx-text);
        }

        .new-proj-btn-submit {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--nx-violet) 0%, var(--nx-violet) 100%);
          color: var(--nx-on-accent);
          border: none;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(155, 140, 255, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .new-proj-btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--nx-violet) 0%, var(--nx-violet) 100%);
          box-shadow: 0 6px 20px rgba(155, 140, 255, 0.45);
          transform: translateY(-1px);
        }

        .new-proj-btn-submit:disabled {
          background: var(--nx-border);
          color: var(--nx-text-3);
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
