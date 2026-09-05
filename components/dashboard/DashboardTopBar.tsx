'use client';

import React from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded';

interface DashboardTopBarProps {
  workspaceName: string;
  projectName: string;
  projectKey: string;
  inboxCount: number;
  onOpenCommandPalette: () => void;
  onQuickCreate: () => void;
  onOpenInbox: () => void;
}

export function DashboardTopBar({
  workspaceName,
  projectName,
  projectKey,
  inboxCount,
  onOpenCommandPalette,
  onQuickCreate,
  onOpenInbox,
}: DashboardTopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="dash-header glass-panel">
      {/* Left: Breadcrumbs & Project badge */}
      <div className="dash-header__left">
        <span className="dash-header__ws">{workspaceName}</span>
        <span className="dash-header__sep">/</span>
        <div className="dash-header__project">
          <FolderSpecialRoundedIcon sx={{ fontSize: 16, color: '#6366F1' }} />
          <span className="dash-header__project-name">{projectName}</span>
          <span className="dash-header__project-key">{projectKey}</span>
        </div>
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

      <style jsx>{`
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          margin-bottom: 20px;
          border-radius: 14px;
          position: sticky;
          top: 12px;
          z-index: 50;
        }

        .dash-header__left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
        }

        .dash-header__ws {
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .dash-header__sep {
          color: var(--color-text-tertiary);
        }

        .dash-header__project {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--color-surface-hover);
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }

        .dash-header__project-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .dash-header__project-key {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          background: rgba(99, 102, 241, 0.15);
          color: var(--color-primary);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .dash-header__center {
          flex: 1;
          max-width: 360px;
          margin: 0 16px;
        }

        .dash-search-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 7px 14px;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--color-text-tertiary);
          font-size: 0.8125rem;
        }

        .dash-search-trigger:hover {
          border-color: var(--color-border-strong);
          background: var(--color-surface-hover);
          color: var(--color-text-secondary);
        }

        .dash-search-placeholder {
          flex: 1;
          text-align: left;
        }

        .dash-header__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }

        .header-icon-btn:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
          border-color: var(--color-border-strong);
        }

        .header-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #EF4444;
          color: #FFFFFF;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 9999px;
          border: 2px solid var(--color-surface);
        }

        .btn-primary-gradient {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--color-primary-gradient);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all var(--transition-smooth);
        }

        .btn-primary-gradient:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        @media (max-width: 768px) {
          .dash-header__center {
            display: none;
          }
          .dash-header__project-name {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
