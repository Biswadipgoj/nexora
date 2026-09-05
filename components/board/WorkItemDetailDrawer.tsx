'use client';

import React, { useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { TASK_CATEGORIES, getCategoryByIdOrName } from '@/lib/constants/categories';
import type { WorkItemData } from './KanbanBoard';

export interface WorkItemDetailDrawerProps {
  item: WorkItemData | null;
  isOpen: boolean;
  onClose: () => void;
  projectKey?: string;
  statuses?: Array<{ id: string; name: string }>;
  types?: Array<{ id: string; name: string }>;
  onUpdated?: (updatedItem: WorkItemData) => void;
  onDeleted?: (deletedItemId: string) => void;
  onUpdateItem?: (updatedItem: WorkItemData) => void;
  onDeleteItem?: (deletedItemId: string) => void;
}

const DEFAULT_STATUSES = [
  { id: 'status-todo', name: 'To Do' },
  { id: 'status-in-progress', name: 'In Progress' },
  { id: 'status-done', name: 'Done' },
];

export function WorkItemDetailDrawer({
  item,
  isOpen,
  onClose,
  projectKey = 'PRJ',
  statuses = DEFAULT_STATUSES,
  types = [],
  onUpdated,
  onDeleted,
  onUpdateItem,
  onDeleteItem,
}: WorkItemDetailDrawerProps) {
  const [title, setTitle] = useState(item?.title || '');
  const [statusId, setStatusId] = useState(item?.status_id || 'status-todo');
  const [typeId, setTypeId] = useState(item?.type_id || 'type-task');
  const [priority, setPriority] = useState(item?.priority ?? 1);
  const [dueDate, setDueDate] = useState(item?.due_date || '');
  const [description, setDescription] = useState(
    typeof item?.description === 'string'
      ? item.description
      : item?.description?.ops?.[0]?.insert || ''
  );
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; done: boolean }>>([
    { id: 'st-1', title: 'Review specifications & requirements', done: true },
    { id: 'st-2', title: 'Verify design contrast and keyboard accessibility', done: false },
    { id: 'st-3', title: 'Test on both mobile and desktop viewports', done: false },
  ]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    { id: 'c-1', author: 'NEXORA Bot', text: 'Task initialized and placed on Kanban board.', time: 'Just now' },
  ]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setStatusId(item.status_id || 'status-todo');
      setTypeId(item.type_id || 'type-task');
      setPriority(item.priority ?? 1);
      setDueDate(item.due_date || '');
      setDescription(
        typeof item.description === 'string'
          ? item.description
          : item.description?.ops?.[0]?.insert || ''
      );
    }
  }, [item]);

  const activeCategory = getCategoryByIdOrName(typeId);

  if (!item) return null;

  const handleUpdate = (updates: Partial<WorkItemData>) => {
    const updated = { ...item, ...updates };
    if (onUpdated) onUpdated(updated);
    if (onUpdateItem) onUpdateItem(updated);

    // Save to server
    try {
      fetch(`/api/work-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {}
  };

  const handleDelete = () => {
    if (onDeleted) onDeleted(item.id);
    if (onDeleteItem) onDeleteItem(item.id);
    onClose();

    try {
      fetch(`/api/work-items/${item.id}`, { method: 'DELETE' });
    } catch {}
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: 'st-' + Date.now(), title: newSubtaskTitle.trim(), done: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: 'c-' + Date.now(),
        author: 'You',
        text: newComment.trim(),
        time: 'Just now',
      },
    ]);
    setNewComment('');
  };

  const completedCount = subtasks.filter((s) => s.done).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 540 },
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            borderLeft: '1px solid var(--color-border)',
            backgroundImage: 'var(--color-bg-mesh)',
          },
        },
      }}
    >
      <div className="drawer-root">
        {/* Top Sticky Header */}
        <div className="drawer-topbar">
          <div className="drawer-topbar__key">
            <span>{projectKey}-{item.sequence || 1}</span>
            <span
              className="drawer-category-chip"
              style={{
                color: activeCategory.color,
                backgroundColor: activeCategory.bgColor,
                borderColor: activeCategory.borderColor,
              }}
            >
              <span>{activeCategory.icon}</span>
              <span>{activeCategory.shortName}</span>
            </span>
          </div>

          <div className="drawer-topbar__actions">
            <IconButton
              size="small"
              onClick={handleDelete}
              title="Delete task"
              sx={{ color: 'var(--color-text-tertiary)', '&:hover': { color: '#EF4444' } }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <IconButton
              size="small"
              onClick={onClose}
              title="Close drawer"
              sx={{ color: 'var(--color-text-tertiary)', '&:hover': { color: 'var(--color-text-primary)' } }}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </div>
        </div>

        {/* Content Body */}
        <div className="drawer-body">
          {/* Editable Title */}
          <textarea
            className="drawer-title-input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleUpdate({ title: e.target.value });
            }}
            placeholder="Issue title..."
            rows={2}
          />

          {/* Quick Properties Bar */}
          <div className="drawer-props-grid">
            <div className="prop-row">
              <span className="prop-label">Category</span>
              <select
                className="prop-select"
                value={typeId}
                onChange={(e) => {
                  setTypeId(e.target.value);
                  handleUpdate({ type_id: e.target.value });
                }}
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="prop-row">
              <span className="prop-label">Status</span>
              <select
                className="prop-select"
                value={statusId}
                onChange={(e) => {
                  setStatusId(e.target.value);
                  handleUpdate({ status_id: e.target.value });
                }}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="prop-row">
              <span className="prop-label">Priority</span>
              <select
                className="prop-select"
                value={priority}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPriority(val);
                  handleUpdate({ priority: val });
                }}
              >
                <option value={4}>🔴 Urgent</option>
                <option value={3}>🟠 High</option>
                <option value={2}>🟡 Medium</option>
                <option value={1}>🔵 Low</option>
                <option value={0}>⚪ None</option>
              </select>
            </div>

            <div className="prop-row">
              <span className="prop-label">Due Date</span>
              <input
                type="date"
                className="prop-input"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleUpdate({ due_date: e.target.value });
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="drawer-section">
            <h3 className="section-title">Description</h3>
            <textarea
              className="drawer-desc-input"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                handleUpdate({ description: e.target.value });
              }}
              placeholder="Add a detailed description, notes, or acceptance criteria..."
              rows={4}
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="drawer-section">
            <div className="section-header">
              <h3 className="section-title">Subtasks</h3>
              <span className="progress-badge">
                {completedCount}/{subtasks.length} ({progressPercent}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="subtask-progress-track">
              <div
                className="subtask-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="subtasks-list">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className={`subtask-item ${st.done ? 'subtask-item--done' : ''}`}
                  onClick={() => handleToggleSubtask(st.id)}
                >
                  {st.done ? (
                    <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, color: 'var(--color-done)' }} />
                  ) : (
                    <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: 'var(--color-text-tertiary)' }} />
                  )}
                  <span className="subtask-title">{st.title}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="add-subtask-form">
              <input
                type="text"
                placeholder="+ Add a checklist subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="add-subtask-input"
              />
            </form>
          </div>

          {/* Activity & Comments Stream */}
          <div className="drawer-section">
            <h3 className="section-title">Activity & Discussion</h3>

            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">
                    {c.author.charAt(0)}
                  </div>
                  <div className="comment-bubble">
                    <div className="comment-top">
                      <span className="comment-author">{c.author}</span>
                      <span className="comment-time">{c.time}</span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <input
                type="text"
                placeholder="Leave a comment or mention @team..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="comment-input"
              />
              <button type="submit" className="comment-send-btn" disabled={!newComment.trim()}>
                <SendRoundedIcon sx={{ fontSize: 14 }} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .drawer-root {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .drawer-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--color-border);
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .drawer-topbar__key {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-primary);
        }

        .drawer-topbar__key > span:first-child {
          background: rgba(99, 102, 241, 0.12);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .drawer-category-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .drawer-topbar__actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px 24px 48px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .drawer-title-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
          font-family: inherit;
          resize: none;
          line-height: 1.35;
        }

        .drawer-props-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 12px 16px;
        }

        .prop-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prop-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
        }

        .prop-select,
        .prop-input {
          background: var(--color-bg-subtle);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          font-size: 0.8125rem;
          padding: 4px 8px;
          border-radius: 6px;
          outline: none;
        }

        .drawer-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .progress-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--color-done);
        }

        .subtask-progress-track {
          height: 4px;
          background: var(--color-border);
          border-radius: 9999px;
          overflow: hidden;
        }

        .subtask-progress-bar {
          height: 100%;
          background: var(--color-done);
          transition: width 0.3s ease;
        }

        .drawer-desc-input {
          width: 100%;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 12px;
          font-size: 0.875rem;
          color: var(--color-text-primary);
          font-family: inherit;
          resize: vertical;
          outline: none;
        }

        .drawer-desc-input:focus {
          border-color: var(--color-primary);
        }

        .subtasks-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .subtask-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 8px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          cursor: pointer;
          font-size: 0.8125rem;
          transition: all 0.12s ease;
        }

        .subtask-item:hover {
          background: var(--color-surface-hover);
        }

        .subtask-item--done .subtask-title {
          text-decoration: line-through;
          color: var(--color-text-tertiary);
        }

        .add-subtask-input {
          width: 100%;
          background: transparent;
          border: 1px dashed var(--color-border);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.75rem;
          color: var(--color-text-primary);
          outline: none;
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .comment-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .comment-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--color-primary);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .comment-bubble {
          flex: 1;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 8px 12px;
        }

        .comment-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .comment-author {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .comment-time {
          font-size: 0.6875rem;
          color: var(--color-text-tertiary);
        }

        .comment-text {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }

        .comment-form {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
        }

        .comment-input {
          flex: 1;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.8125rem;
          color: var(--color-text-primary);
          outline: none;
        }

        .comment-send-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--color-primary);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .comment-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </Drawer>
  );
}
