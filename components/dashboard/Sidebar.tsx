'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import { Logo } from '@/components/ui/Logo';

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
        <div style={{ paddingLeft: 34, fontSize: '0.7rem', color: '#64748B', marginTop: -4, fontWeight: 500 }}>
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
          <div className="share-shortcut-card" onClick={onShareProject}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="share-icon-tonal">
                <ShareRoundedIcon sx={{ fontSize: 14, color: '#4F46E5' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>Share Project</div>
                <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Invite collaborators</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div className="profile-chip">
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            border: '2px solid #C7D2FE'
          }}>
            {getInitials(user.name)}
          </div>
          <div className="profile-info">
            <div className="profile-name">
              {user.name}
            </div>
            <div className="profile-email">{user.email || 'demo@nexora.io'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
