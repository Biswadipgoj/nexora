import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { isDemoRequest } from '@/lib/supabase/config';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { getDemoProjectById } from '@/lib/demo/demo-store';
import { UUID_REGEX } from '@/lib/db/reference-ids';
import { Logo } from '@/components/ui/Logo';
import { ProjectBoardActions } from '@/components/board/ProjectBoardActions';
import '@/components/dashboard/dashboard.css';

interface ActiveProject {
  id: string;
  workspace_id: string;
  name: string;
  key: string;
  mode: 'simple' | 'advanced';
  description?: string | null;
}

/**
 * Loads the project the URL names, or nothing.
 *
 * A missing, deleted or access-denied project 404s rather than falling back
 * to the demo board, and the same 404 answers "not found" and "not yours" so
 * the response reveals nothing about projects the user cannot see. Demo mode
 * resolves the id against the demo store — it used to show the sample project
 * whatever id was in the URL, so a project created in the demo opened the
 * sample board instead of its own.
 */
async function loadProject(id: string): Promise<{ project: ActiveProject | null; isDemo: boolean }> {
  const cookieStore = await cookies();
  if (isDemoRequest(cookieStore)) {
    const demo = getDemoProjectById(id);
    return { project: demo ?? null, isDemo: true };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/projects/${id}`)}`);
  if (!UUID_REGEX.test(id)) return { project: null, isDemo: false };

  const { data: fetchedProject } = await supabase
    .from('projects')
    .select('id, workspace_id, name, key, mode, description')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  return { project: (fetchedProject as ActiveProject | null) ?? null, isDemo: false };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { project } = await loadProject(id);
  return { title: project ? `${project.name} (${project.key})` : 'Project board' };
}

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, isDemo } = await loadProject(id);

  if (!project) notFound();

  return (
    <div className="dash-main" style={{ minHeight: '100vh' }}>
      <header className="dash-topbar">
        <nav className="dash-crumbs" aria-label="Breadcrumb">
          <Link href="/dashboard" aria-label="Back to the workspace">
            <Logo size="sm" withText={false} />
          </Link>
          <Link href="/dashboard?tab=projects" className="dash-crumbs__ws">
            Projects
          </Link>
          <span className="dash-crumbs__sep" aria-hidden="true">
            /
          </span>
          <span className="dash-crumbs__page" aria-current="page">
            {project.name}
          </span>
          <span className="nx-key">{project.key}</span>
        </nav>

        <div className="dash-topbar__actions" style={{ marginLeft: 'auto' }}>
          {isDemo && <span className="nx-chip">Demo</span>}
          <Link href="/dashboard" className="nx-btn nx-btn--ghost nx-btn--sm">
            Workspace
          </Link>
          <ProjectBoardActions
            projectId={project.id}
            projectName={project.name}
            projectKey={project.key}
            workspaceId={project.workspace_id}
          />
          {/* Ends a real session as well as the demo one. */}
          <a href="/api/auth/signout" className="nx-btn nx-btn--ghost nx-btn--sm">
            {isDemo ? 'Leave demo' : 'Sign out'}
          </a>
        </div>
      </header>

      <main className="dash-content dash-content--wide">
        <header className="page-head">
          <div>
            <h1 className="page-head__title">{project.name}</h1>
            {project.description && <p className="page-head__sub">{project.description}</p>}
          </div>
        </header>
        <KanbanBoard
          workspaceId={project.workspace_id}
          projectId={project.id}
          projectName={project.name}
          projectKey={project.key}
          projectMode={project.mode}
        />
      </main>
    </div>
  );
}
