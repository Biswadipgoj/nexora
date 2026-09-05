'use client';

import React, { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { TASK_CATEGORIES } from '@/lib/constants/categories';
import type { WorkItemData } from './KanbanBoard';

export interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  initialStatusId?: string;
  availableStatuses?: Array<{ id: string; name: string }>;
  availableTypes?: Array<{ id: string; name: string }>;
  onSuccess?: (newItem: WorkItemData) => void;
  onItemCreated?: (newItem: WorkItemData) => void;
}

export function QuickCreateModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  initialStatusId = 'status-todo',
  availableStatuses = [
    { id: 'status-todo', name: 'To Do' },
    { id: 'status-in-progress', name: 'In Progress' },
    { id: 'status-done', name: 'Done' },
  ],
  availableTypes = TASK_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
  onSuccess,
  onItemCreated,
}: QuickCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(initialStatusId);
  const [typeId, setTypeId] = useState(availableTypes[0]?.id || 'type-task');
  const [priority, setPriority] = useState<number>(1);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStatusId(initialStatusId || availableStatuses[0]?.id || 'status-todo');
      setPriority(1);
      setDueDate('');
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialStatusId, availableStatuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);

    const optimisticItem: WorkItemData = {
      id: 'wi-' + Date.now(),
      workspace_id: workspaceId,
      project_id: projectId,
      type_id: typeId,
      status_id: statusId,
      title: title.trim(),
      description: description ? { ops: [{ insert: description + '\n' }] } : null,
      priority,
      due_date: dueDate || null,
      sequence: Math.floor(Math.random() * 900) + 10,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Instant optimistic response
    if (onSuccess) onSuccess(optimisticItem);
    if (onItemCreated) onItemCreated(optimisticItem);
    onClose();

    // Persist to server
    try {
      await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          type_id: typeId,
          status_id: statusId,
          title: title.trim(),
          description: description ? { ops: [{ insert: description + '\n' }] } : null,
          priority,
          due_date: dueDate || null,
        }),
      });
    } catch {} finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 2.5,
            px: 3,
            fontSize: '1.125rem',
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AddRoundedIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            <span>Create New Task</span>
          </div>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: 'var(--color-text-tertiary)', '&:hover': { color: 'var(--color-text-primary)' } }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Title */}
          <div>
            <label className="field-label">Issue Title</label>
            <input
              ref={titleInputRef}
              type="text"
              required
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field-input field-input--title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="field-label">Description (optional)</label>
            <textarea
              placeholder="Add additional context, acceptance criteria, or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="field-textarea"
            />
          </div>

          {/* Category / Work Type Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="field-label" style={{ marginBottom: 0 }}>Category / Work Type</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                {TASK_CATEGORIES.find((c) => c.id === typeId)?.description || 'Select work category'}
              </span>
            </div>
            <div className="category-pill-grid">
              {TASK_CATEGORIES.map((cat) => {
                const isSelected = typeId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTypeId(cat.id)}
                    className={`category-pill-btn ${isSelected ? 'category-pill-btn--selected' : ''}`}
                    style={{
                      borderColor: isSelected ? cat.color : undefined,
                      backgroundColor: isSelected ? cat.bgColor : undefined,
                      color: isSelected ? cat.color : undefined,
                    }}
                  >
                    <span className="category-pill-icon">{cat.icon}</span>
                    <span className="category-pill-name">{cat.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="properties-row">
            {/* Status */}
            <div className="prop-field">
              <label className="field-label">Status</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="field-select"
              >
                {availableStatuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="prop-field">
              <label className="field-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="field-select"
              >
                <option value={4}>🔴 Urgent</option>
                <option value={3}>🟠 High</option>
                <option value={2}>🟡 Medium</option>
                <option value={1}>🔵 Low</option>
                <option value={0}>⚪ None</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="prop-field">
              <label className="field-label">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="field-input"
              />
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Press <kbd className="kbd-shortcut">↵ Enter</kbd> to submit
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={onClose}
              sx={{ color: 'var(--color-text-secondary)', textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="modal-submit-btn"
            >
              Create Task
            </button>
          </div>
        </DialogActions>
      </form>

      <style jsx>{`
        .field-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .field-input,
        .field-textarea,
        .field-select {
          width: 100%;
          background: var(--color-bg-subtle);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: inherit;
          outline: none;
          transition: all var(--transition-fast);
        }

        .field-input:focus,
        .field-textarea:focus,
        .field-select:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .field-input--title {
          font-size: 1rem;
          font-weight: 600;
        }

        .field-textarea {
          resize: vertical;
        }

        .properties-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .category-pill-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .category-pill-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 8px;
          border: 1.5px solid var(--color-border);
          background: var(--color-bg-subtle);
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .category-pill-btn:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .category-pill-btn--selected {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }

        .category-pill-icon {
          font-size: 0.95rem;
          line-height: 1;
        }

        .category-pill-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 600px) {
          .category-pill-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .prop-field {
          display: flex;
          flex-direction: column;
        }

        .modal-submit-btn {
          background: var(--color-primary-gradient);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-smooth);
        }

        .modal-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .modal-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 520px) {
          .properties-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Dialog>
  );
}
