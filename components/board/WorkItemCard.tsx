'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
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
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { getCategoryByIdOrName } from '@/lib/constants/categories';

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

const PRIORITY_DATA: Record<number, { label: string; class: string; glow: string; color: string }> = {
  4: { label: 'Urgent', class: 'badge-priority--urgent', glow: 'rgba(255, 113, 133, 0.4)', color: 'var(--nx-red)' },
  3: { label: 'High', class: 'badge-priority--high', glow: 'rgba(241, 184, 106, 0.4)', color: 'var(--nx-amber)' },
  2: { label: 'Medium', class: 'badge-priority--medium', glow: 'rgba(241, 184, 106, 0.4)', color: 'var(--nx-amber)' },
  1: { label: 'Low', class: 'badge-priority--low', glow: 'rgba(70, 215, 232, 0.4)', color: 'var(--nx-cyan)' },
  0: { label: 'None', class: 'badge-priority--low', glow: 'rgba(148, 163, 184, 0.2)', color: 'var(--nx-text-3)' },
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
  epicColor = 'var(--nx-violet)',
  assignees,
  onClick,
  onStatusChange,
  availableStatuses = [],
}: WorkItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt interactive motion values
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [7, -7]), { stiffness: 450, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-7, 7]), { stiffness: 450, damping: 25 });
  const glareX = useTransform(x, [0, 1], ['0%', '100%']);
  const glareY = useTransform(y, [0, 1], ['0%', '100%']);

  const p = PRIORITY_DATA[priority] ?? PRIORITY_DATA[0];
  const isDone = statusId.toLowerCase().includes('done');
  const category = getCategoryByIdOrName(typeName);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
    setIsHovered(false);
  }

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
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      /* Section 5.5: "Hover can reveal secondary actions; keyboard focus must
         reveal them as well." */
      onFocus={() => setIsHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) handleMouseLeave();
      }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.97 }}
      className={`card-container glass-card ${isHovered ? 'card-container--hovered' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Only when the card itself holds focus, so the controls nested inside
        // it keep their own key handling.
        if (e.target !== e.currentTarget) return;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
          return;
        }

        /* Section 9: the board "must support keyboard navigation, card
           activation, drawer closing, and status movement without requiring
           drag and drop. Pointer drag is an enhancement, not the only
           interaction." Left and right step through the status columns. */
        if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && onStatusChange && availableStatuses.length > 1) {
          const current = availableStatuses.findIndex((s) => s.id === statusId);
          if (current === -1) return;
          const next = current + (e.key === 'ArrowRight' ? 1 : -1);
          if (next < 0 || next >= availableStatuses.length) return;
          e.preventDefault();
          onStatusChange(availableStatuses[next].id);
        }
      }}
      aria-label={`${projectKey}-${sequence}: ${title}. Use left and right arrow keys to change status.`}
      aria-roledescription="Work item card"
    >
      {/* Dynamic 3D Specular Glare Layer */}
      <motion.div
        className="card-glare"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle 220px at ${glareX} ${glareY}, ${p.glow}, transparent 75%)`,
        }}
      />

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
            {isDone && <CheckRoundedIcon sx={{ fontSize: 12, color: 'var(--nx-on-accent)' }} />}
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
        <span
          className={`badge-priority ${p.class}`}
          style={{
            boxShadow: isHovered ? `0 0 10px ${p.glow}` : 'none',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <span className="priority-dot" style={{ backgroundColor: p.color }} />
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
          <span
            className="card-category-badge"
            style={{
              color: category.color,
              backgroundColor: category.bgColor,
              borderColor: category.borderColor,
            }}
            title={`${category.name}: ${category.description}`}
          >
            <span className="card-category-icon">{category.icon}</span>
            <span className="card-category-text">{category.shortName}</span>
          </span>

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
                    sx={{ bgcolor: 'var(--color-primary)', color: 'var(--nx-on-accent)', fontWeight: 'bold' }}
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
          border-radius: 14px;
          background: var(--nx-surface);
          border: 1px solid var(--nx-border);
          box-shadow: 0 4px 14px -1px rgba(0, 0, 0, 0.31), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(24px) saturate(220%) brightness(106%);
          -webkit-backdrop-filter: blur(24px) saturate(220%) brightness(106%);
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.25s ease, background 0.2s ease;
        }

        .card-container--hovered {
          border-color: var(--nx-border-strong);
          background: var(--nx-surface-2);
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.50), 0 0 24px rgba(155, 140, 255, 0.25), inset 0 1.5px 0 0 rgba(255, 255, 255, 0.05);
        }

        .card-glare {
          pointer-events: none;
          position: absolute;
          inset: -60%;
          border-radius: 50%;
          transition: opacity 0.25s ease;
          mix-blend-mode: overlay;
          z-index: 1;
        }

        .card-header {
          position: relative;
          z-index: 2;
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
          border: 1.5px solid rgba(0, 0, 0, 0.50);
          background: var(--nx-surface);
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
          background: var(--nx-surface);
        }

        .card-key {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 800;
          color: var(--aurora-iris);
        }

        .copied-hint {
          font-size: 0.625rem;
          color: var(--color-done);
          font-weight: 700;
        }

        .priority-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 6px currentColor;
        }

        .card-epic {
          position: relative;
          z-index: 2;
          margin-bottom: 6px;
        }

        .card-epic-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          letter-spacing: 0.02em;
        }

        .card-title {
          position: relative;
          z-index: 2;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.4;
          margin-bottom: 12px;
          word-break: break-word;
        }

        .card-title--done {
          text-decoration: line-through;
          color: var(--text-subtle);
        }

        .card-footer {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid rgba(0, 0, 0, 0.21);
        }

        .card-footer__left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
        }

        .card-category-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 6px;
          border: 1px solid transparent;
          font-weight: 700;
          font-size: 0.6875rem;
          letter-spacing: 0.01em;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.15s ease;
        }

        .card-category-badge:hover {
          transform: translateY(-1px);
        }

        .card-category-icon {
          font-size: 0.75rem;
          line-height: 1;
        }

        .card-category-text {
          white-space: nowrap;
        }

        .card-points {
          font-family: var(--font-mono);
          color: var(--nx-cyan);
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .card-due {
          color: var(--text-muted);
          display: flex;
          align-items: center;
          font-size: 0.6875rem;
          font-weight: 600;
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
