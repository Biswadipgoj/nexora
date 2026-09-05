import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { DEMO_PROJECT } from '@/lib/demo/demo-store';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { LivingAuroraCanvas } from '@/components/ui/motion/LivingAuroraCanvas';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      {/* Living Aurora Background Canvas */}
      <LivingAuroraCanvas />

      {/* Floating Prismatic Top Navigation Bar */}
      <header className="project-header-wrap">
        <div className="project-header-pill">
          {/* Left: Brand Logo + Breadcrumb */}
          <div className="project-nav-left">
            <Link href="/dashboard" className="project-brand-link">
              <Logo size="sm" withText animated />
            </Link>

            <span className="project-breadcrumb-sep">/</span>

            <Link href="/dashboard" className="project-breadcrumb-link">
              <DashboardRoundedIcon sx={{ fontSize: 16 }} />
              <span>Workspace</span>
            </Link>

            <span className="project-breadcrumb-sep">/</span>

            {/* Active Project Pill */}
            <div className="project-key-pill">
              <FolderSpecialRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-iris)' }} />
              <span className="project-key-name">{activeProject.name}</span>
              <span className="project-key-tag">{activeProject.key}</span>
            </div>
          </div>

          {/* Right: Badges & Navigation Actions */}
          <div className="project-nav-right">
            {isDemo && (
              <span className="project-demo-badge">
                ⚡ Demo Mode
              </span>
            )}

            <div className="project-sync-badge">
              <span className="project-sync-dot" />
              <span>Live Sync</span>
            </div>

            <Link href="/dashboard" className="project-dashboard-btn">
              <ArrowBackRoundedIcon sx={{ fontSize: 15 }} />
              <span>Dashboard</span>
            </Link>

            <a
              href="/auth/login?logout=true"
              className="project-signout-btn"
              title="Sign Out"
            >
              <LogoutRoundedIcon sx={{ fontSize: 16 }} />
              <span>Sign out</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Kanban Board Container */}
      <main className="project-main-stage">
        <div className="project-board-shell">
          <KanbanBoard
            workspaceId={activeProject.workspace_id}
            projectId={activeProject.id}
            projectKey={activeProject.key}
            projectName={activeProject.name}
            projectMode={activeProject.mode}
          />
        </div>
      </main>
    </div>
  );
}
