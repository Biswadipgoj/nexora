'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { Logo } from '@/components/ui/Logo';

import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/theme/ThemeProvider';

interface SidebarProps {
  user: { name: string; email?: string; avatar?: string };
  primaryWorkspace: { id: string; name: string; slug: string };
  projects: Array<{ id: string; name: string; key: string }>;
  activeTab: 'overview' | 'inbox' | 'tasks' | 'projects';
  setActiveTab: (tab: 'overview' | 'inbox' | 'tasks' | 'projects') => void;
  onQuickCreate: () => void;
  onShareProject: () => void;
  onCreateProject?: () => void;
  inboxCount: number;
}

export function Sidebar({
  user,
  primaryWorkspace,
  projects,
  activeTab,
  setActiveTab,
  onQuickCreate,
  onShareProject,
  onCreateProject,
  inboxCount,
}: SidebarProps) {
  const { theme, themeLocked, toggleTheme } = useTheme();

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  return (
    <aside className="dash-sidebar">
      {/* Brand & Workspace Switcher Header */}
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-header">
          <Logo size="sm" animated withText />
        </div>
        <div className="sidebar-workspace-pill">
          <div className="workspace-pill-avatar">
            {primaryWorkspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="workspace-pill-meta">
            <span className="workspace-pill-name">{primaryWorkspace.name}</span>
            <span className="workspace-pill-status">
              <span className="workspace-pill-dot" />
              <span>Synced & Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">WORKSPACE</div>
        <button
          onClick={() => setActiveTab('overview')}
          className={`nav-item-btn ${activeTab === 'overview' ? 'nav-item-btn--active' : ''}`}
        >
          <div className="nav-icon-container"><DashboardRoundedIcon sx={{ fontSize: 17 }} /></div>
          <span className="nav-label">Overview Board</span>
          {activeTab === 'overview' && <div className="nav-active-bar" />}
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`nav-item-btn ${activeTab === 'inbox' ? 'nav-item-btn--active' : ''}`}
        >
          <div className="nav-icon-container"><InboxRoundedIcon sx={{ fontSize: 17 }} /></div>
          <span className="nav-label">Inbox</span>
          {inboxCount > 0 && <span className="nav-badge-pill">{inboxCount}</span>}
          {activeTab === 'inbox' && <div className="nav-active-bar" />}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`nav-item-btn ${activeTab === 'tasks' ? 'nav-item-btn--active' : ''}`}
        >
          <div className="nav-icon-container"><AssignmentTurnedInRoundedIcon sx={{ fontSize: 17 }} /></div>
          <span className="nav-label">My Tasks</span>
          {activeTab === 'tasks' && <div className="nav-active-bar" />}
        </button>

        <div className="nav-divider" />

        {/* Section 6.4 requires Projects to be one of the four shared
            destinations, so the rail and the mobile dock agree. */}
        <button
          onClick={() => setActiveTab('projects')}
          className={`nav-item-btn ${activeTab === 'projects' ? 'nav-item-btn--active' : ''}`}
        >
          <div className="nav-icon-container"><FolderOpenRoundedIcon sx={{ fontSize: 17 }} /></div>
          <span className="nav-label">Projects</span>
          <span className="nav-count-chip">{projects.length}</span>
          {activeTab === 'projects' && <div className="nav-active-bar" />}
        </button>

        <div className="nav-group-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>RECENT</span>
          {onCreateProject && (
            <button
              onClick={onCreateProject}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--nx-blue)',
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px',
                borderRadius: 4,
              }}
              title="Create new project"
              aria-label="Create new project"
            >
              <AddRoundedIcon sx={{ fontSize: 16 }} />
            </button>
          )}
        </div>
        <div className="projects-list-nav">
          {projects.map((p) => (
            <a href={`/projects/${p.id}`} key={p.id} className="project-link-item">
              <div className="project-tonal-dot" />
              <span className="project-title-nav">{p.name}</span>
              <span className="project-code-tag">{p.key}</span>
            </a>
          ))}
        </div>

        {/* Global Action Shortcuts */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0 4px' }}>
          <button
            className="btn-primary-gradient"
            onClick={onQuickCreate}
            style={{ width: '100%', justifyContent: 'center', borderRadius: 12, padding: '10px 16px' }}
          >
            <AddRoundedIcon sx={{ fontSize: 18 }} />
            <span>New Task</span>
            <span className="kbd-shortcut kbd-shortcut--on-accent" style={{ marginLeft: 6 }}>
              C
            </span>
          </button>
          <div
            className="share-shortcut-card"
            onClick={onShareProject}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--nx-surface)',
              border: '1px solid var(--nx-border)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.10)',
              cursor: 'pointer',
              transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'rgba(110, 168, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--nx-blue)',
                }}
              >
                <ShareRoundedIcon sx={{ fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--nx-text)' }}>Share Project</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--nx-text-3)' }}>Invite collaborators</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile Footer, Theme Toggle & Sign Out */}
      <div className="sidebar-footer">


        <div className="profile-chip" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 34,
              height: 34,
              minWidth: 34,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--nx-on-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              border: '2px solid var(--color-border-accent)',
            }}>
              {getInitials(user.name)}
            </div>
            <div className="profile-info" style={{ overflow: 'hidden' }}>
              <div className="profile-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div className="profile-email" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email || 'user@nexora.io'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Hidden until light mode reaches parity (sections 2 and 3.5). */}
            {!themeLocked && (
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="sidebar-profile-action"
              >
                {theme === 'dark' ? (
                  <LightModeRoundedIcon sx={{ fontSize: 17 }} />
                ) : (
                  <DarkModeRoundedIcon sx={{ fontSize: 17 }} />
                )}
              </button>
            )}

            <button
              onClick={async () => {
                try {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                } catch {}
                window.location.href = '/api/auth/signout';
              }}
              title="Sign out"
              aria-label="Sign out"
              className="sidebar-profile-action sidebar-profile-action--danger"
            >
              <LogoutRoundedIcon sx={{ fontSize: 17 }} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
