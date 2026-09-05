'use client';

import React from 'react';
import { motion } from 'motion/react';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import './super-app-bar.css';

export interface SuperAppBottomBarProps {
  activeTab: 'overview' | 'inbox' | 'tasks' | 'board';
  onTabChange: (tab: 'overview' | 'inbox' | 'tasks' | 'board') => void;
  onQuickAction: () => void;
  inboxCount?: number;
  taskCount?: number;
  projectId?: string;
}

export function SuperAppBottomBar({
  activeTab,
  onTabChange,
  onQuickAction,
  inboxCount = 0,
  taskCount = 0,
  projectId = 'd0000000-0000-4000-8000-000000000001',
}: SuperAppBottomBarProps) {
  return (
    <nav className="super-app-dock-container" aria-label="Mobile Navigation Dock">
      <div className="super-app-dock">
        {/* Tab 1: Dashboard / Overview */}
        <motion.button
          type="button"
          className={`super-dock-item ${activeTab === 'overview' ? 'super-dock-item--active' : ''}`}
          onClick={() => onTabChange('overview')}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          aria-label="Overview Dashboard"
        >
          {activeTab === 'overview' && (
            <motion.div
              layoutId="super-dock-active-pill"
              className="super-dock-active-glow"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <div className="super-dock-icon">
            <DashboardRoundedIcon sx={{ fontSize: 22 }} />
          </div>
          <span className="super-dock-label">Home</span>
        </motion.button>

        {/* Tab 2: Board / Projects */}
        <motion.button
          type="button"
          className={`super-dock-item ${activeTab === 'board' ? 'super-dock-item--active' : ''}`}
          onClick={() => {
            if (window.location.pathname.includes('/projects/')) {
              onTabChange('board');
            } else {
              window.location.href = `/projects/${projectId}`;
            }
          }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          aria-label="Kanban Board"
        >
          {activeTab === 'board' && (
            <motion.div
              layoutId="super-dock-active-pill"
              className="super-dock-active-glow"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <div className="super-dock-icon">
            <ViewKanbanRoundedIcon sx={{ fontSize: 22 }} />
          </div>
          <span className="super-dock-label">Board</span>
        </motion.button>

        {/* Center: Raised Super Action Button (+) */}
        <div className="super-dock-center-slot">
          <motion.button
            type="button"
            className="super-action-fab"
            onClick={onQuickAction}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.9, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            aria-label="Create New Work Item"
          >
            <div className="super-action-fab-ring" />
            <div className="super-action-fab-core">
              <AddRoundedIcon sx={{ fontSize: 28, color: '#FFFFFF' }} />
            </div>
          </motion.button>
        </div>

        {/* Tab 3: My Tasks */}
        <motion.button
          type="button"
          className={`super-dock-item ${activeTab === 'tasks' ? 'super-dock-item--active' : ''}`}
          onClick={() => {
            if (!window.location.pathname.includes('/dashboard')) {
              window.location.href = '/dashboard';
            } else {
              onTabChange('tasks');
            }
          }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          aria-label="My Tasks"
        >
          {activeTab === 'tasks' && (
            <motion.div
              layoutId="super-dock-active-pill"
              className="super-dock-active-glow"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <div className="super-dock-icon">
            <AssignmentTurnedInRoundedIcon sx={{ fontSize: 22 }} />
            {taskCount > 0 && <span className="super-dock-badge">{taskCount}</span>}
          </div>
          <span className="super-dock-label">Tasks</span>
        </motion.button>

        {/* Tab 4: Inbox / Feed */}
        <motion.button
          type="button"
          className={`super-dock-item ${activeTab === 'inbox' ? 'super-dock-item--active' : ''}`}
          onClick={() => {
            if (!window.location.pathname.includes('/dashboard')) {
              window.location.href = '/dashboard';
            } else {
              onTabChange('inbox');
            }
          }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          aria-label="Inbox"
        >
          {activeTab === 'inbox' && (
            <motion.div
              layoutId="super-dock-active-pill"
              className="super-dock-active-glow"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <div className="super-dock-icon">
            <InboxRoundedIcon sx={{ fontSize: 22 }} />
            {inboxCount > 0 && (
              <span className="super-dock-badge super-dock-badge--ping">
                {inboxCount}
              </span>
            )}
          </div>
          <span className="super-dock-label">Inbox</span>
        </motion.button>
      </div>
    </nav>
  );
}
