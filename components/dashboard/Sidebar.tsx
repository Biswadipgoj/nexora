'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { Logo } from '@/components/ui/Logo';
import { CreatorBadge } from '@/components/ui/CreatorBadge';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/theme/ThemeProvider';

interface SidebarProps {
  user: { name: string; email?: string; avatar?: string };
  primaryWorkspace: { id: string; name: string; slug: string };
  projects: Array<{ id: string; name: string; key: string }>;
  activeTab: 'overview' | 'inbox' | 'tasks';
  setActiveTab: (tab: 'overview' | 'inbox' | 'tasks') => void;
  onQuickCreate: () => void;
  onShareProject: () => void;
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
  inboxCount,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

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

        <div className="nav-group-title">
          PROJECTS <span className="nav-count-chip">{projects.length}</span>
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
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                color: '#FFFFFF',
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 5,
                marginLeft: 6,
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              C
            </span>
          </button>
          <div
            className="share-shortcut-card"
            onClick={onShareProject}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
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
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <ShareRoundedIcon sx={{ fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Share Project</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Invite collaborators</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile Footer, Theme Toggle & Sign Out */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
          <CreatorBadge size="sm" />
        </div>

        <div className="profile-chip" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 34,
              height: 34,
              minWidth: 34,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
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
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-tertiary)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {theme === 'dark' ? (
                <LightModeRoundedIcon sx={{ fontSize: 17 }} />
              ) : (
                <DarkModeRoundedIcon sx={{ fontSize: 17 }} />
              )}
            </button>

            <button
              onClick={async () => {
                try {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                } catch {}
                window.location.href = '/api/auth/signout';
              }}
              title="Sign out"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-tertiary)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#EF4444';
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogoutRoundedIcon sx={{ fontSize: 17 }} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
