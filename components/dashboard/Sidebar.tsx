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
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <Logo size="sm" animated withText />
        <div style={{ paddingLeft: 34, fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: -4, fontWeight: 500 }}>
          {primaryWorkspace.name}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">MAIN MENU</div>
        <button
          onClick={() => setActiveTab('overview')}
          className={`nav-item-btn ${activeTab === 'overview' ? 'nav-item-btn--active' : ''}`}
        >
          <div className="nav-icon-container"><DashboardRoundedIcon sx={{ fontSize: 18 }} /></div>
          <span className="nav-label">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`nav-item-btn ${activeTab === 'inbox' ? 'nav-item-btn--active' : ''}`}
        >
          <div className="nav-icon-container"><InboxRoundedIcon sx={{ fontSize: 18 }} /></div>
          <span className="nav-label">Inbox</span>
          {inboxCount > 0 && <span className="nav-badge-pill">{inboxCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`nav-item-btn ${activeTab === 'tasks' ? 'nav-item-btn--active' : ''}`}
        >
          <div className="nav-icon-container"><AssignmentTurnedInRoundedIcon sx={{ fontSize: 18 }} /></div>
          <span className="nav-label">My Tasks</span>
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
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary" onClick={onQuickCreate} style={{ width: '100%', justifyContent: 'center' }}>
            <AddRoundedIcon sx={{ fontSize: 16 }} />
            New Issue
            <kbd className="shortcut-kbd">C</kbd>
          </button>
          <div
            className="share-shortcut-card"
            onClick={onShareProject}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--color-primary-tonal, rgba(99,102,241,0.12))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShareRoundedIcon sx={{ fontSize: 15, color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Share Project</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Invite collaborators</div>
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
