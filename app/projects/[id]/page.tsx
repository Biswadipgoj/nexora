import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: project } = await supabase
    .from('projects')
    .select('name, key')
    .eq('id', id)
    .single();

  return {
    title: project ? `${project.name} (${project.key}) — NEXORA` : 'Project Board — NEXORA',
  };
}

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch project details
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, workspace_id, name, key, mode, is_personal')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !project) {
    // If not found in DB or RLS blocked
    return (
      <div className="project-page-fallback">
        <header className="project-page-header">
          <a href="/dashboard" className="project-page-back">
            ← Dashboard
          </a>
        </header>
        <div className="project-page-container">
          <KanbanBoard
            workspaceId="default-workspace"
            projectId={id}
            projectKey="NEX"
            projectName="Demo Project"
            projectMode="simple"
          />
        </div>
        <style>{`
          .project-page-fallback {
            min-height: 100vh;
            background: var(--color-bg);
          }
          .project-page-header {
            padding: var(--space-4) var(--space-6);
            border-bottom: 1px solid var(--color-border);
            background: var(--color-surface);
          }
          .project-page-back {
            color: var(--color-text-secondary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="project-page">
      <header className="project-page__nav">
        <div className="project-page__nav-left">
          <a href="/dashboard" className="project-page__back-link">
            ← Back
          </a>
          <span className="project-page__divider">/</span>
          <span className="project-page__breadcrumb">{project.name}</span>
        </div>
      </header>

      <main className="project-page__main">
        <KanbanBoard
          workspaceId={project.workspace_id}
          projectId={project.id}
          projectKey={project.key}
          projectName={project.name}
          projectMode={project.mode}
        />
      </main>

      <style>{`
        .project-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-bg);
        }

        .project-page__nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-6);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          height: var(--header-height);
        }

        .project-page__nav-left {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
        }

        .project-page__back-link {
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
          text-decoration: none;
        }

        .project-page__back-link:hover {
          color: var(--color-text-primary);
        }

        .project-page__divider {
          color: var(--color-text-tertiary);
        }

        .project-page__breadcrumb {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .project-page__main {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
