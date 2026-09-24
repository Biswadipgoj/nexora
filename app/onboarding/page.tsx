'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { hasDemoCookie } from '@/lib/supabase/demo-client';
import { ensureDefaultProject } from '@/lib/db/ensure-project';
import { FlowShell } from '@/components/auth/FlowShell';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

const noopSubscribe = () => () => {};

/**
 * First run: name the workspace. No scheme, workflow or permission screens
 * before the first task — the default project and its columns are created
 * here, and the next screen is the board.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inDemo = useSyncExternalStore(noopSubscribe, hasDemoCookie, () => false);

  const slug = slugify(workspaceName);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login?next=/onboarding');
        return;
      }

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name,
          // A random suffix keeps the slug unique without a round trip.
          slug: `${slug || 'workspace'}-${Math.random().toString(36).slice(2, 6)}`,
          is_personal: false,
          owner_id: user.id,
          plan: 'free',
          settings: {},
        })
        .select('id, name, slug')
        .single();

      if (wsError || !workspace) {
        setError(wsError?.message ?? 'Could not create the workspace. Try again.');
        setLoading(false);
        return;
      }

      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' });
      if (memberError) console.warn('[onboarding] owner membership insert failed:', memberError.message);

      await ensureDefaultProject(supabase, workspace.id, user.id, name);

      router.replace('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  if (inDemo || !isSupabaseConfigured()) {
    return (
      <FlowShell>
        <h1 className="auth-heading">{inDemo ? 'You are in the demo workspace' : 'Accounts are not set up here'}</h1>
        <p className="auth-subheading">
          {inDemo
            ? 'The demo already has a workspace and a project. Create an account to set up your own.'
            : 'This deployment has no account service configured, so there is nothing to set up. The demo workspace works fully.'}
        </p>
        <div className="flow-actions" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
          <Link href="/dashboard" className="nx-btn nx-btn--primary">
            Go to the workspace
          </Link>
          {inDemo && isSupabaseConfigured() && (
            <Link href="/auth/signup" className="nx-btn nx-btn--secondary">
              Create an account
            </Link>
          )}
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell>
      <p className="nx-eyebrow">Step 1 of 1</p>
      <h1 className="auth-heading" style={{ marginTop: 12 }}>
        Name your workspace
      </h1>
      <p className="auth-subheading">Usually your team or company. You can rename it later.</p>

      <form onSubmit={handleSubmit} className="flow-card" noValidate>
        <div className="nx-field">
          <label htmlFor="workspace-name" className="nx-label">
            Workspace name
          </label>
          <input
            id="workspace-name"
            className="nx-input"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Acme Studio"
            maxLength={100}
            autoFocus
            required
            disabled={loading}
          />
          <span className="flow-slug">
            nexora.app/<strong>{slug || 'your-workspace'}</strong>
          </span>
        </div>

        {error && (
          <div className="nx-alert nx-alert--error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="flow-actions">
          <button type="submit" className="nx-btn nx-btn--primary" disabled={loading || !workspaceName.trim()}>
            {loading && <span className="nx-spinner" aria-hidden="true" />}
            {loading ? 'Setting up…' : 'Create workspace'}
          </button>
        </div>
      </form>
    </FlowShell>
  );
}
