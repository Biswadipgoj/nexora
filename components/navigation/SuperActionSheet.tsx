'use client';

import React from 'react';
import Drawer from '@mui/material/Drawer';
import AddTaskRoundedIcon from '@mui/icons-material/AddTaskRounded';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import './navigation.css';

export interface SuperActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickCreate: () => void;
  onLogBug: () => void;
  onShareProject: () => void;
  onCreateProject: () => void;
}

/** The phone's create menu, opened from the dock's centre button. */
export function SuperActionSheet({
  isOpen,
  onClose,
  onQuickCreate,
  onLogBug,
  onShareProject,
  onCreateProject,
}: SuperActionSheetProps) {
  const actions: Array<{ title: string; sub: string; icon: React.ReactNode; run: () => void }> = [
    { title: 'New task', sub: 'Add work to the current project', icon: <AddTaskRoundedIcon sx={{ fontSize: 19 }} />, run: onQuickCreate },
    { title: 'Log a bug', sub: 'Bug category, high priority', icon: <BugReportOutlinedIcon sx={{ fontSize: 19 }} />, run: onLogBug },
    { title: 'New project', sub: 'A board with its own key', icon: <CreateNewFolderOutlinedIcon sx={{ fontSize: 19 }} />, run: onCreateProject },
    { title: 'Share project', sub: 'Invite links and a read-only link', icon: <IosShareRoundedIcon sx={{ fontSize: 19 }} />, run: onShareProject },
  ];

  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderLeft: 'none',
            borderTop: '1px solid var(--nx-line)',
            maxHeight: '85vh',
          },
        },
      }}
    >
      <div className="sheet" role="menu" aria-label="Create">
        <div className="sheet__grabber" aria-hidden="true" />
        <p className="sheet__title nx-eyebrow">Create</p>
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            role="menuitem"
            className="sheet__item"
            onClick={() => {
              onClose();
              action.run();
            }}
          >
            <span className="sheet__item-icon">{action.icon}</span>
            <span>
              <span className="sheet__item-title">{action.title}</span>
              <span className="sheet__item-sub">{action.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </Drawer>
  );
}
