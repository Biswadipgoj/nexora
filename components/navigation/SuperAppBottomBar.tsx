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
  activeTab: 'overview' | 'inbox' | 'tasks' | 'projects';
  onTabChange: (tab: 'overview' | 'inbox' | 'tasks' | 'projects') => void;
  onQuickAction: () => void;
  inboxCount?: number;
  taskCount?: number;
}

/**
 * Android navigation dock — Master Design Document, section 6.4.
 *
 * "On Android, replace the persistent left rail with the existing bottom bar,
 * but preserve the same four destinations: Home, Inbox, My Tasks, and Projects."
 *
 * The second slot used to be "Board", which hard-navigated to a hard-coded
 * project UUID. On any workspace whose first project was not the demo one that
 * opened a dead board, and it left the user on a route where the dock is not
 * mounted at all — stranded with no navigation. It is now Projects, the same
 * destination the rail exposes.
 */
export function SuperAppBottomBar({
  activeTab,
  onTabChange,
  onQuickAction,
  inboxCount = 0,
  taskCount = 0,
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

        {/* Tab 2: Projects — the same destination the rail exposes */}
        <motion.button
          type="button"
          className={`super-dock-item ${activeTab === 'projects' ? 'super-dock-item--active' : ''}`}
          onClick={() => onTabChange('projects')}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          aria-label="Projects"
        >
          {activeTab === 'projects' && (
            <motion.div
              layoutId="super-dock-active-pill"
              className="super-dock-active-glow"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <div className="super-dock-icon">
            <ViewKanbanRoundedIcon sx={{ fontSize: 22 }} />
          </div>
          <span className="super-dock-label">Projects</span>
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
              <AddRoundedIcon sx={{ fontSize: 28, color: 'var(--nx-on-accent)' }} />
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
