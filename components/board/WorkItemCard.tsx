'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';

export interface WorkItemCardProps {
  id: string;
  sequence: number;
  projectKey: string;
  title: string;
  priority: number;
  statusId: string;
  dueDate?: string | null;
  typeName?: string;
  storyPoints?: number;
  epicName?: string;
  epicColor?: string;
  assignees?: Array<{
    name: string;
    avatar?: string;
    role?: string;
  }> | null;
  onClick?: () => void;
  onStatusChange?: (newStatusId: string) => void;
  availableStatuses?: Array<{ id: string; name: string }>;
}

const PRIORITY_DATA: Record<number, { label: string; class: string }> = {
  4: { label: 'Urgent', class: 'badge-priority--urgent' },
  3: { label: 'High', class: 'badge-priority--high' },
  2: { label: 'Medium', class: 'badge-priority--medium' },
  1: { label: 'Low', class: 'badge-priority--low' },
  0: { label: 'None', class: 'badge-priority--low' },
};

export function WorkItemCard({
  sequence,
  projectKey,
  title,
  priority,
  statusId,
  dueDate,
  typeName = 'Task',
  storyPoints,
  epicName,
  epicColor = '#8B5CF6',
  assignees,
  onClick,
  onStatusChange,
  availableStatuses = [],
}: WorkItemCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const p = PRIORITY_DATA[priority] ?? PRIORITY_DATA[0];
  const isDone = statusId.toLowerCase().includes('done');

  const handleCopyKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${projectKey}-${sequence}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange || availableStatuses.length === 0) return;
    if (isDone) {
      const todo = availableStatuses.find((s) => s.name.toLowerCase().includes('to do') || s.id.includes('todo'));
      if (todo) onStatusChange(todo.id);
    } else {
      const done = availableStatuses.find((s) => s.name.toLowerCase().includes('done'));
      if (done) onStatusChange(done.id);
    }
  };

  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: 1.015,
        transition: { type: 'spring', stiffness: 450, damping: 25 },
      }}
      whileTap={{ scale: 0.97 }}
      className="card-container glass-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${projectKey}-${sequence}: ${title}`}
    >
      {/* Top Header: Checkbox + Key + Copy + Priority */}
      <div className="card-header">
        <div className="card-header__left">
          {/* 1-Click Status Checkbox */}
          <button
            className={`card-checkbox ${isDone ? 'card-checkbox--done' : ''}`}
            onClick={handleToggleDone}
            title={isDone ? 'Mark as Incomplete' : 'Mark as Done'}
            aria-label="Toggle completed"
          >
            {isDone && <CheckRoundedIcon sx={{ fontSize: 12, color: '#FFFFFF' }} />}
          </button>

          {/* Issue Key */}
          <button
            className="card-key-btn"
            onClick={handleCopyKey}
            title={copied ? 'Copied!' : 'Copy issue ID'}
          >
            <span className="card-key">{projectKey}-{sequence}</span>
            {copied ? (
              <span className="copied-hint">Copied!</span>
            ) : (
              <ContentCopyRoundedIcon sx={{ fontSize: 11, opacity: 0.5 }} className="copy-icon" />
            )}
          </button>
        </div>

        {/* Priority Badge */}
        <span className={`badge-priority ${p.class}`}>
          <span className="priority-dot" />
          {p.label}
        </span>
      </div>

      {/* Epic Tag if available */}
      {epicName && (
        <div className="card-epic">
          <span
            className="card-epic-tag"
            style={{
              color: epicColor,
              backgroundColor: `${epicColor}15`,
              borderColor: `${epicColor}35`,
            }}
          >
            ⚡ {epicName}
          </span>
        </div>
      )}

      {/* Title */}
      <div className={`card-title ${isDone ? 'card-title--done' : ''}`}>
        {title}
      </div>

      {/* Footer Metadata: Type badge, Due date, Assignees */}
      <div className="card-footer">
        <div className="card-footer__left">
          <span className="card-type-chip">{typeName}</span>

          {storyPoints !== undefined && (
            <span className="card-points">{storyPoints} pts</span>
          )}

          {dueDate && (
            <span className="card-due">
              <CalendarTodayRoundedIcon sx={{ fontSize: 11, mr: 0.3, opacity: 0.7 }} />
              {dueDate}
            </span>
          )}
        </div>

        <div className="card-footer__right">
          {assignees && assignees.length > 0 && (
            <AvatarGroup
              max={3}
              sx={{
                '& .MuiAvatar-root': {
                  width: 22,
                  height: 22,
                  fontSize: '0.65rem',
                  border: '1.5px solid var(--color-surface)',
                },
              }}
            >
              {assignees.map((a, idx) => (
                <Tooltip key={`${a.name}-${idx}`} title={`Assignee: ${a.name}`} arrow>
                  <Avatar
                    src={a.avatar}
                    sx={{ bgcolor: 'var(--color-primary)', color: '#fff', fontWeight: 'bold' }}
                    alt={a.name}
                  >
                    {!a.avatar ? a.name.charAt(0) : ''}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}

          {/* Quick Status Move Menu */}
          {availableStatuses.length > 0 && (
            <>
              <Tooltip title="Move status" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(e.currentTarget);
                  }}
                  sx={{
                    width: 22,
                    height: 22,
                    color: 'var(--color-text-tertiary)',
                    '&:hover': {
                      backgroundColor: 'var(--color-surface-hover)',
                      color: 'var(--color-text-primary)',
                    },
                  }}
                  aria-label="Change status"
                >
                  <ArrowForwardRoundedIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                onClick={(e) => e.stopPropagation()}
              >
                {availableStatuses
                  .filter((s) => s.id !== statusId)
                  .map((s) => (
                    <MenuItem
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnchorEl(null);
                        onStatusChange?.(s.id);
                      }}
                      sx={{ fontSize: '0.8125rem' }}
                    >
                      Move to <strong style={{ marginLeft: 4 }}>{s.name}</strong>
                    </MenuItem>
                  ))}
              </Menu>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .card-container {
          padding: 12px 14px;
          cursor: pointer;
          position: relative;
          user-select: none;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .card-header__left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .card-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1.5px solid var(--color-border-strong);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all var(--transition-fast);
        }

        .card-checkbox:hover {
          border-color: var(--color-primary);
        }

        .card-checkbox--done {
          background: var(--color-done);
          border-color: var(--color-done);
        }

        .card-key-btn {
          background: transparent;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: all var(--transition-fast);
        }

        .card-key-btn:hover {
          background: var(--color-surface-hover);
        }

        .card-key {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .copied-hint {
          font-size: 0.625rem;
          color: var(--color-done);
          font-weight: 700;
        }

        .priority-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .card-epic {
          margin-bottom: 6px;
        }

        .card-epic-tag {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 1.5px 6px;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        .card-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-primary);
          line-height: 1.4;
          margin-bottom: 12px;
          word-break: break-word;
        }

        .card-title--done {
          text-decoration: line-through;
          color: var(--color-text-tertiary);
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--color-border-subtle);
        }

        .card-footer__left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
        }

        .card-type-chip {
          background: var(--color-surface-hover);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .card-points {
          font-family: var(--font-mono);
          color: var(--color-text-tertiary);
          font-weight: 600;
        }

        .card-due {
          color: var(--color-text-tertiary);
          display: flex;
          align-items: center;
        }

        .card-footer__right {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </motion.div>
  );
}
