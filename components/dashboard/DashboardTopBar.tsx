'use client';

import React from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';

interface DashboardTopBarProps {
  workspaceName: string;
  projectName: string;
  projectKey: string;
  inboxCount: number;
  activeTab?: 'overview' | 'inbox' | 'tasks';
  onOpenCommandPalette: () => void;
  onQuickCreate: () => void;
  onOpenInbox: () => void;
}

export function DashboardTopBar({
  workspaceName,
  projectName,
  projectKey,
  inboxCount,
  activeTab = 'overview',
  onOpenCommandPalette,
  onQuickCreate,
  onOpenInbox,
}: DashboardTopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="dash-header glass-panel">
      {/* Left: Dynamic Breadcrumbs & Section badge */}
      <div className="dash-header__left">
        <span className="dash-header__ws">{workspaceName}</span>
        <span className="dash-header__sep">/</span>
        {activeTab === 'inbox' ? (
          <div className="dash-header__project">
            <InboxRoundedIcon sx={{ fontSize: 16, color: '#4f46e5' }} />
            <span className="dash-header__project-name">Inbox</span>
            {inboxCount > 0 && (
              <span className="dash-header__project-key" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>
                {inboxCount} new
              </span>
            )}
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="dash-header__project">
            <AssignmentTurnedInRoundedIcon sx={{ fontSize: 16, color: '#059669' }} />
            <span className="dash-header__project-name">My Tasks</span>
          </div>
        ) : (
          <div className="dash-header__project">
            <FolderSpecialRoundedIcon sx={{ fontSize: 16, color: '#2563eb' }} />
            <span className="dash-header__project-name">{projectName}</span>
            <span className="dash-header__project-key">{projectKey}</span>
          </div>
        )}
      </div>

      {/* Middle: Command Palette Quick Trigger */}
      <div className="dash-header__center">
        <button
          className="dash-search-trigger"
          onClick={onOpenCommandPalette}
          aria-label="Search or jump to (Ctrl+K)"
        >
          <SearchRoundedIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)' }} />
          <span className="dash-search-placeholder">Search, jump to, or press</span>
          <span className="kbd-shortcut">Ctrl+K</span>
        </button>
      </div>

      {/* Right: Actions, Theme toggle, Notification Bell, New Task */}
      <div className="dash-header__right">
        {/* Theme Toggle Button */}
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <LightModeRoundedIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
          ) : (
            <DarkModeRoundedIcon sx={{ fontSize: 18, color: '#6366F1' }} />
          )}
        </button>

        {/* Notifications Bell */}
        <button
          className="header-icon-btn"
          onClick={onOpenInbox}
          aria-label="Notifications"
          title="Inbox"
        >
          <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
          {inboxCount > 0 && <span className="header-badge">{inboxCount}</span>}
        </button>

        {/* New Task Button */}
        <button className="btn-primary-gradient" onClick={onQuickCreate}>
          <AddRoundedIcon sx={{ fontSize: 16 }} />
          <span>New Task</span>
          <span className="kbd-shortcut" style={{ background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', border: 'none', marginLeft: 4 }}>C</span>
        </button>
      </div>
    </header>
  );
}
