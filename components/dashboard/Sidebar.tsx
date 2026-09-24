'use client';

import React from 'react';
import Link from 'next/link';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Marks';
import { useTheme } from '@/components/theme/ThemeProvider';

export type DashboardTab = 'overview' | 'inbox' | 'tasks' | 'projects';

interface SidebarProps {
  user: { name: string; email?: string };
  primaryWorkspace: { id: string; name: string; slug: string };
  projects: Array<{ id: string; name: string; key: string }>;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  onQuickCreate: () => void;
  onShareProject: () => void;
  onCreateProject?: () => void;
  onSignOut: () => void;
  inboxCount: number;
  openTaskCount: number;
  isDemo: boolean;
}

/**
 * The workspace rail. Its four destinations — Overview, Inbox, My tasks and
 * Projects — are the same four the mobile dock exposes.
 */
export function Sidebar({
  user,
  primaryWorkspace,
  projects,
  activeTab,
  setActiveTab,
  onQuickCreate,
  onShareProject,
  onCreateProject,
  onSignOut,
  inboxCount,
  openTaskCount,
  isDemo,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  const item = (tab: DashboardTab, label: string, icon: React.ReactNode, trailing?: React.ReactNode) => (
    <button
      type="button"
      className="rail-item"
      aria-current={activeTab === tab ? 'page' : undefined}
      onClick={() => setActiveTab(tab)}
    >
      {icon}
      <span className="rail-item__label">{label}</span>
      {trailing}
    </button>
  );

  return (
    <div className="dash-rail-col">
    <aside className="dash-rail" aria-label="Workspace navigation">
      <div className="rail-ws">
        <Logo size="md" withText={false} />
        <div className="rail-ws__meta">
          <span className="rail-ws__name">{primaryWorkspace.name}</span>
          <span className="rail-ws__plan">{isDemo ? 'Demo workspace' : 'Workspace'}</span>
        </div>
      </div>

      <nav className="rail-nav" aria-label="Views">
        {item('overview', 'Overview', <HomeOutlinedIcon sx={{ fontSize: 18 }} />)}
        {item(
          'inbox',
          'Inbox',
          <InboxOutlinedIcon sx={{ fontSize: 18 }} />,
          inboxCount > 0 ? <span className="nx-count nx-count--accent">{inboxCount}</span> : null
        )}
        {item(
          'tasks',
          'My tasks',
          <TaskAltOutlinedIcon sx={{ fontSize: 18 }} />,
          openTaskCount > 0 ? <span className="nx-count">{openTaskCount}</span> : null
        )}
        {item('projects', 'Projects', <FolderOutlinedIcon sx={{ fontSize: 18 }} />, <span className="nx-count">{projects.length}</span>)}
      </nav>

      <div className="rail-group">
        <div className="rail-group__head">
          <span className="nx-eyebrow">Projects</span>
          {onCreateProject && (
            <button
              type="button"
              className="nx-icon-btn"
              onClick={onCreateProject}
              aria-label="New project"
              title="New project"
            >
              <AddRoundedIcon sx={{ fontSize: 16 }} />
            </button>
          )}
        </div>
        {projects.slice(0, 8).map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="rail-item">
            <span className="rail-item__label">{p.name}</span>
            <span className="nx-key">{p.key}</span>
          </Link>
        ))}
        {projects.length > 8 && (
          <button type="button" className="rail-item" onClick={() => setActiveTab('projects')}>
            <span className="rail-item__label" style={{ color: 'var(--nx-ink-3)' }}>
              All {projects.length} projects
            </span>
          </button>
        )}
      </div>

      <div className="rail-foot">
        <button type="button" className="nx-btn nx-btn--secondary nx-btn--block" onClick={onQuickCreate}>
          <AddRoundedIcon sx={{ fontSize: 17 }} />
          New task
          <kbd className="nx-kbd" style={{ marginLeft: 'auto' }}>
            C
          </kbd>
        </button>
        <button type="button" className="rail-item" onClick={onShareProject}>
          <IosShareRoundedIcon sx={{ fontSize: 17 }} />
          <span className="rail-item__label">Share project</span>
        </button>

        <div className="rail-user">
          <Avatar name={user.name} size="lg" />
          <div className="rail-user__meta">
            <span className="rail-user__name">{user.name}</span>
            {user.email && <span className="rail-user__email">{user.email}</span>}
          </div>
          <button
            type="button"
            className="nx-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <LightModeOutlinedIcon sx={{ fontSize: 17 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 17 }} />}
          </button>
          <button
            type="button"
            className="nx-icon-btn nx-icon-btn--danger"
            onClick={onSignOut}
            aria-label={isDemo ? 'Leave the demo' : 'Sign out'}
            title={isDemo ? 'Leave the demo' : 'Sign out'}
          >
            <LogoutRoundedIcon sx={{ fontSize: 17 }} />
          </button>
        </div>
      </div>
    </aside>
    </div>
  );
}
