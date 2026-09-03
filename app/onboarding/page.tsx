'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Onboarding — Create first workspace.
 * §5 J1: Time-to-first-work-item with zero required reading.
 * §10.2: Personal workspace auto-created alongside.
 * §5 J2: No scheme/workflow/permission screen before first work item.
 */
export default function OnboardingPage() {
  const [step, setStep] = useState<'workspace' | 'creating'>('workspace');
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setError(null);
    setLoading(true);
    setStep('creating');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const slug = generateSlug(workspaceName);

      // Create the team workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName.trim(),
          slug: slug || `ws-${Date.now()}`,
          is_personal: false,
          owner_id: user.id,
          plan: 'free',
          settings: {},
        })
        .select('id, name, slug')
        .single();

      if (wsError) {
        setError(wsError.message);
        setStep('workspace');
        return;
      }

      // Add creator as owner
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      });

      // Create personal workspace if none exists
      const { data: personalCheck } = await supabase
        .from('workspaces')
        .select('id')
        .eq('is_personal', true)
        .eq('owner_id', user.id)
        .limit(1);

      if (!personalCheck || personalCheck.length === 0) {
        const { data: personalWs } = await supabase
          .from('workspaces')
          .insert({
            name: 'Personal',
            slug: `personal-${user.id.slice(0, 8)}`,
            is_personal: true,
            owner_id: user.id,
            plan: 'free',
            settings: {},
          })
          .select('id')
          .single();

        if (personalWs) {
          await supabase.from('workspace_members').insert({
            workspace_id: personalWs.id,
            user_id: user.id,
            role: 'owner',
          });
        }
      }

      // Success — redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('workspace');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__container">
        <div className="onboarding__logo">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="var(--color-accent)" />
            <path d="M14 34V14L24 28L34 14V34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {step === 'creating' && !error ? (
          <div className="onboarding__creating">
            <div className="onboarding__spinner" aria-label="Setting up your workspace">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Setting up your workspace...</h2>
            <p>This only takes a moment.</p>
          </div>
        ) : (
          <>
            <h1 className="onboarding__title">Welcome to NEXORA</h1>
            <p className="onboarding__subtitle">
              Let&apos;s create your first workspace. You can always add more later.
            </p>

            {error && (
              <div className="auth-form__error" role="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zM8 11a1 1 0 100-2 1 1 0 000 2z"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="onboarding__form">
              <div className="auth-form__field">
                <label htmlFor="workspace-name" className="auth-form__label">
                  Workspace name
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Team, Acme Corp, Personal Projects..."
                  required
                  autoFocus
                  maxLength={100}
                  disabled={loading}
                  className="auth-form__input"
                />
                {workspaceName && (
                  <span className="onboarding__slug">
                    nexora.app/<strong>{generateSlug(workspaceName) || '...'}</strong>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !workspaceName.trim()}
                className="auth-form__submit"
              >
                Create workspace
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        .onboarding {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg);
          padding: var(--space-6);
        }

        .onboarding__container {
          width: 100%;
          max-width: 440px;
          text-align: center;
        }

        .onboarding__logo {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-8);
        }

        .onboarding__title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .onboarding__subtitle {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-8);
        }

        .onboarding__form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          text-align: left;
        }

        .onboarding__slug {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: var(--space-1);
        }

        .onboarding__slug strong {
          color: var(--color-text-secondary);
        }

        .onboarding__creating {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .onboarding__creating h2 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .onboarding__creating p {
          color: var(--color-text-secondary);
        }

        .onboarding__spinner {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
