'use client';

import React from 'react';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import './navigation.css';

type Tab = 'overview' | 'inbox' | 'tasks' | 'projects';

export interface SuperAppBottomBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onQuickAction: () => void;
  inboxCount?: number;
  taskCount?: number;
}

/**
 * The phone dock. Below 900px it replaces the rail and keeps the same four
 * destinations — Home, Projects, Tasks and Inbox — with create in the middle.
 */
export function SuperAppBottomBar({
  activeTab,
  onTabChange,
  onQuickAction,
  inboxCount = 0,
  taskCount = 0,
}: SuperAppBottomBarProps) {
  const item = (tab: Tab, label: string, icon: React.ReactNode, onSelect: () => void, badge?: number) => (
    <button
      type="button"
      className="dock__item"
      aria-current={activeTab === tab ? 'page' : undefined}
      onClick={onSelect}
    >
      <span className="dock__icon">
        {icon}
        {badge ? <span className="dock__badge">{badge > 99 ? '99+' : badge}</span> : null}
      </span>
      {label}
    </button>
  );

  return (
    <nav className="dock" aria-label="Primary">
      {item('overview', 'Home', <HomeOutlinedIcon sx={{ fontSize: 21 }} />, () => onTabChange('overview'))}
      {item('projects', 'Projects', <FolderOutlinedIcon sx={{ fontSize: 21 }} />, () => onTabChange('projects'))}
      <button type="button" className="dock__fab" onClick={onQuickAction} aria-label="Create">
        <AddRoundedIcon sx={{ fontSize: 26 }} />
      </button>
      {item('tasks', 'Tasks', <TaskAltOutlinedIcon sx={{ fontSize: 21 }} />, () => onTabChange('tasks'), taskCount)}
      {item('inbox', 'Inbox', <InboxOutlinedIcon sx={{ fontSize: 21 }} />, () => onTabChange('inbox'), inboxCount)}
    </nav>
  );
}
