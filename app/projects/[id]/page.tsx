import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { DEMO_PROJECT } from '@/lib/demo/demo-store';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('nexora_demo_session')?.value === 'true';

  if (isDemo) {
    return {
      title: `${DEMO_PROJECT.name} (${DEMO_PROJECT.key}) — NEXORA`,
    };
  }

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
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('nexora_demo_session')?.value === 'true';

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isDemo) {
    redirect('/auth/login');
  }

  // Fetch project details or use demo
  let activeProject: {
    id: string;
    workspace_id: string;
    name: string;
    key: string;
    mode: 'simple' | 'advanced';
    is_personal?: boolean;
  } = DEMO_PROJECT;

  if (!isDemo) {
    const { data: fetchedProject } = await supabase
      .from('projects')
      .select('id, workspace_id, name, key, mode, is_personal')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchedProject) {
      activeProject = fetchedProject;
    }
  }

  return (
    <div className="project-page-root">
      {/* Clean Breadcrumb Navigation Bar */}
      <header className="project-nav-bar">
        <div className="project-nav-left">
          <a href="/dashboard" className="nav-brand-link" style={{ textDecoration: 'none' }}>
            <Logo size="sm" withText />
          </a>

          <span className="nav-divider">/</span>

          <a href="/dashboard" className="nav-crumb-link">
            Projects
          </a>

          <span className="nav-divider">/</span>

          <span className="nav-crumb-active">{activeProject.name}</span>
        </div>

        <div className="project-nav-right">
          {isDemo && (
            <span className="demo-nav-badge">Demo Mode</span>
          )}
          <div className="nav-status-badge">
            <span className="status-dot-indicator" style={{ backgroundColor: '#16A34A' }} />
            <span>Connected</span>
          </div>
          <a href="/dashboard" className="nav-link-btn">
            Dashboard
          </a>
          <a href="/auth/login?logout=true" className="nav-logout-btn">
            Sign out
          </a>
        </div>
      </header>

      <main className="project-board-main">
        <KanbanBoard
          workspaceId={activeProject.workspace_id}
          projectId={activeProject.id}
          projectKey={activeProject.key}
          projectName={activeProject.name}
          projectMode={activeProject.mode}
        />
      </main>

      <style>{`
        .project-page-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #FAFBFC;
        }

        .project-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          background-color: #FFFFFF;
          border-bottom: 1px solid #E5E7EB;
          height: var(--header-height);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .project-nav-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8125rem;
        }

        .nav-brand-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .nav-logo-wrap {
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #E5E7EB;
          display: flex;
        }

        .nav-logo-img {
          object-fit: cover;
        }

        .nav-brand-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.875rem;
          color: #0F172A;
        }

        .nav-divider {
          color: #CBD5E1;
        }

        .nav-crumb-link {
          color: #64748B;
          font-weight: 500;
          text-decoration: none;
          transition: color 120ms ease;
        }

        .nav-crumb-link:hover {
          color: #0F172A;
        }

        .nav-crumb-active {
          font-weight: 600;
          color: #0F172A;
        }

        .project-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #15803D;
          background: #F0FDF4;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          border: 1px solid #BBF7D0;
        }

        .demo-nav-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #4F46E5;
          background: #EEF2FF;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          border: 1px solid #C7D2FE;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .nav-link-btn {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475467;
          text-decoration: none;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          transition: all 120ms ease;
        }

        .nav-link-btn:hover {
          color: #0F172A;
          border-color: #CBD5E1;
        }

        .nav-logout-btn {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          text-decoration: none;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          transition: color 120ms ease;
        }

        .nav-logout-btn:hover {
          color: #EF4444;
        }

        .project-board-main {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
