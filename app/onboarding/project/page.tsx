'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { hasDemoCookie } from '@/lib/supabase/demo-client';
import { DEMO_WORKSPACE } from '@/lib/demo/demo-store';
import { projectKeyError, PROJECT_KEY_PATTERN, suggestProjectKey } from '@/lib/work/project-key';
import { FlowShell } from '@/components/auth/FlowShell';

/**
 * Create a project and land directly on its board.
 *
 * In the demo this used to query Supabase for a workspace, find none, and
 * leave the submit button disabled forever.
 */
export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceMissing, setWorkspaceMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hasDemoCookie() || !isSupabaseConfigured()) {
        if (!cancelled) setWorkspaceId(DEMO_WORKSPACE.id);
        return;
      }
      const { data } = await createClient()
        .from('workspaces')
        .select('id')
        .eq('is_personal', false)
        .order('created_at', { ascending: true })
        .limit(1);
      if (cancelled) return;
      if (data && data.length > 0) setWorkspaceId(data[0].id);
      else setWorkspaceMissing(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const keyProblem = projectKeyError(key);
  const canSubmit = Boolean(name.trim()) && PROJECT_KEY_PATTERN.test(key) && Boolean(workspaceId) && !loading;

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
      router.push(`/projects/${data.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create the project.');
      setLoading(false);
    }
  }

  return (
    <FlowShell
      aside={
        <Link href="/dashboard" className="auth-top__link">
          Back to the workspace
        </Link>
      }
    >
      <h1 className="auth-heading">New project</h1>
      <p className="auth-subheading">A board of its own, with a short key for every task.</p>

      {workspaceMissing ? (
        <div className="flow-card">
          <p>You need a workspace before you can add a project.</p>
          <div className="flow-actions" style={{ justifyContent: 'flex-start' }}>
            <Link href="/onboarding" className="nx-btn nx-btn--primary">
              Create a workspace
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="flow-card" noValidate>
          <div className="cp-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 140px', gap: 12 }}>
            <div className="nx-field">
              <label htmlFor="proj-name" className="nx-label">
                Name
              </label>
              <input
                id="proj-name"
                className="nx-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!keyEdited) setKey(suggestProjectKey(e.target.value));
                }}
                placeholder="Product launch"
                maxLength={100}
                autoFocus
                required
              />
            </div>
            <div className="nx-field">
              <label htmlFor="proj-key" className="nx-label">
                Key
              </label>
              <input
                id="proj-key"
                className="nx-input"
                style={{ fontFamily: 'var(--nx-font-mono)', letterSpacing: '0.04em' }}
                value={key}
                onChange={(e) => {
                  setKeyEdited(true);
                  setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
                }}
                placeholder="PL"
                aria-invalid={Boolean(keyProblem)}
                aria-describedby="proj-key-help"
                required
              />
            </div>
          </div>
          <p id="proj-key-help" className={keyProblem ? 'nx-field__error' : 'nx-field__help'} style={{ marginTop: -8 }}>
            {keyProblem ?? `Tasks will be numbered ${key || 'KEY'}-1, ${key || 'KEY'}-2, and so on.`}
          </p>

          <div className="nx-field">
            <label htmlFor="proj-desc" className="nx-label">
              Description <span className="nx-label__hint">(optional)</span>
            </label>
            <textarea
              id="proj-desc"
              className="nx-textarea"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this project is for."
            />
          </div>

          {error && (
            <div className="nx-alert nx-alert--error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <div className="flow-actions">
            <Link href="/dashboard" className="nx-btn nx-btn--ghost">
              Cancel
            </Link>
            <button type="submit" className="nx-btn nx-btn--primary" disabled={!canSubmit}>
              {loading && <span className="nx-spinner" aria-hidden="true" />}
              {loading ? 'Creating…' : 'Create and open board'}
            </button>
          </div>
        </form>
      )}
    </FlowShell>
  );
}
