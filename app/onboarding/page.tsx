'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
import { ensureDefaultProject } from '@/lib/db/ensure-project';

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

      // Automatically initialize default agile project for this team workspace
      await ensureDefaultProject(supabase, workspace.id, user.id, workspaceName.trim());

      // Success — hard redirect to dashboard to ensure cookies and newly created project load cleanly
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'Something went wrong. Please try again.');
      setStep('workspace');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__container">
        <div className="onboarding__logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Logo size="xl" animated withText />
        </div>

        {step === 'creating' && !error ? (
          <div className="onboarding__creating">
            <div className="onboarding__spinner" aria-label="Setting up your workspace">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#spinnerGrad)" strokeWidth="2.5">
                <defs>
                  <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="50%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Setting up your workspace...</h2>
            <p>This only takes a moment.</p>
          </div>
        ) : (
          <>
            <h1 className="onboarding__title">
              Welcome to <span className="onboarding__brand-grad">NEXORA</span>
            </h1>
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
                  placeholder="e.g., Acme Studio, Core Team, Personal"
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
                Create workspace →
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
          background: radial-gradient(at 10% 12%, rgba(99, 102, 241, 0.18) 0px, transparent 45%),
                      radial-gradient(at 90% 15%, rgba(236, 72, 153, 0.15) 0px, transparent 45%),
                      radial-gradient(at 50% 92%, rgba(14, 165, 233, 0.16) 0px, transparent 50%),
                      radial-gradient(at 85% 85%, rgba(168, 85, 247, 0.12) 0px, transparent 45%),
                      #F8FAFC;
          padding: 24px;
        }

        .onboarding__container {
          width: 100%;
          max-width: 480px;
          text-align: center;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          padding: 44px 36px;
          box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.18),
                      0 0 0 1px rgba(255, 255, 255, 0.9) inset;
        }

        .onboarding__logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .onboarding__logo-ring {
          padding: 3px;
          border-radius: 14px;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
          display: inline-flex;
        }

        .onboarding__logo-img {
          border-radius: 11px;
          object-fit: cover;
          display: block;
          background: #FFFFFF;
        }

        .onboarding__title {
          font-family: var(--font-display, inherit);
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .onboarding__brand-grad {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }

        .onboarding__subtitle {
          color: #475467;
          font-size: 0.9375rem;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .onboarding__form {
          display: flex;
          flex-direction: column;
          gap: 22px;
          text-align: left;
        }

        .auth-form__field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          width: 100%;
        }

        .auth-form__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
        }

        .auth-form__input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.9375rem;
          color: #0F172A;
          background: #FFFFFF;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        .auth-form__input:focus {
          outline: none;
          border-color: #6366F1;
          box-shadow: 0 0 0 3.5px rgba(99, 102, 241, 0.2);
        }

        .auth-form__submit {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 6px;
        }

        .auth-form__submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #4338CA 0%, #6D28D9 100%);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
          transform: translateY(-1px);
        }

        .auth-form__submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-form__submit:disabled {
          background: #E2E8F0;
          color: #94A3B8;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .auth-form__error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          color: #DC2626;
          font-size: 0.875rem;
          margin-bottom: 16px;
        }

        .onboarding__slug {
          display: block;
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 6px;
        }

        .onboarding__slug strong {
          color: #4F46E5;
          font-weight: 600;
        }

        .onboarding__creating {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 24px 0;
        }

        .onboarding__creating h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0F172A;
        }

        .onboarding__creating p {
          color: #64748B;
          font-size: 0.875rem;
        }

        .onboarding__spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
