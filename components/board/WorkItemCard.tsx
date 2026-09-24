'use client';

import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import type { TaskCategory } from '@/lib/constants/categories';
import { bucketOf, formatDueLabel } from '@/lib/work/focus';
import { itemKey } from '@/lib/work/display';
import type { WorkItemData } from '@/lib/work/types';
import { AvatarStack, CategoryMark, PriorityMark } from '@/components/ui/Marks';

export interface WorkItemCardProps {
  item: WorkItemData;
  projectKey: string;
  category: TaskCategory;
  isDone: boolean;
  statusId: string;
  statuses: Array<{ id: string; name: string }>;
  dragging?: boolean;
  onOpen: () => void;
  onToggleDone: () => void;
  onMove: (statusId: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

/**
 * An index card on the board.
 *
 * Pointer drag is an enhancement: every move can also be made from the
 * keyboard (← → between columns) or from the card's menu.
 */
export function WorkItemCard({
  item,
  projectKey,
  category,
  isDone,
  statusId,
  statuses,
  dragging,
  onOpen,
  onToggleDone,
  onMove,
  onDragStart,
  onDragEnd,
}: WorkItemCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  const key = itemKey(projectKey, item.sequence);
  const pending = item.id.startsWith('wi-');
  const dueLabel = formatDueLabel(item);
  const bucket = bucketOf(item);
  const assigneeNames = (item.assignees ?? []).map((a) => a.name).filter(Boolean);

  async function copyKey(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access can be refused (insecure context, permissions).
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Only when the card itself holds focus, so nested controls keep their keys.
    if (e.target !== e.currentTarget) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
      return;
    }

    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && statuses.length > 1) {
      const current = statuses.findIndex((s) => s.id === statusId);
      const next = current + (e.key === 'ArrowRight' ? 1 : -1);
      if (current === -1 || next < 0 || next >= statuses.length) return;
      e.preventDefault();
      onMove(statuses[next].id);
    }
  }

  return (
    <div
      className={`wi-card ${isDone ? 'wi-card--done' : ''} ${dragging ? 'wi-card--dragging' : ''} ${pending ? 'wi-card--pending' : ''}`}
      role="button"
      tabIndex={0}
      draggable={!pending}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label={`${key}: ${item.title}. Press Enter to open, left and right arrows to change status.`}
      aria-roledescription="Task card"
    >
      <div className="wi-card__top">
        <button
          type="button"
          className={`wi-card__check ${isDone ? 'wi-card__check--done' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone();
          }}
          aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
          aria-pressed={isDone}
          disabled={pending}
        >
          <CheckRoundedIcon sx={{ fontSize: 11 }} />
        </button>

        <button type="button" className="wi-card__key" onClick={copyKey} title="Copy key">
          <span className="nx-key">{copied ? 'Copied' : key}</span>
        </button>

        <PriorityMark priority={item.priority} showLabel={(item.priority ?? 0) >= 3} />
        {statuses.length > 1 && !pending && (
          <button
            type="button"
            className="nx-icon-btn wi-card__move"
            aria-label="Move to another column"
            aria-haspopup="menu"
            aria-expanded={Boolean(menuAnchor)}
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchor(e.currentTarget);
            }}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
          </button>
        )}
      </div>

      <p className="wi-card__title">{item.title}</p>

      <div className="wi-card__meta">
        <CategoryMark category={category} />
        {dueLabel && !isDone && <span className={`due due--${bucket}`}>{dueLabel}</span>}
        <AvatarStack names={assigneeNames} />
      </div>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {statuses
          .filter((s) => s.id !== statusId)
          .map((s) => (
            <MenuItem
              key={s.id}
              onClick={() => {
                setMenuAnchor(null);
                onMove(s.id);
              }}
            >
              Move to {s.name}
            </MenuItem>
          ))}
      </Menu>
    </div>
  );
}
