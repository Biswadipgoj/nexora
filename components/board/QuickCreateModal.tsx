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
  /** Replaces the optimistic placeholder with the row the server actually stored. */
  onItemReconciled?: (optimisticId: string, storedItem: WorkItemData) => void;
  /** The write was rejected — the caller should withdraw the optimistic card. */
  onCreateFailed?: (optimisticItem: WorkItemData, message: string) => void;
}

/**
 * Module-level constants, NOT inline default parameters.
 *
 * A default written as `availableStatuses = [...]` builds a new array on every
 * render. That array is in the reset effect's dependency list, so the effect
 * re-ran after every commit and called setTitle('') — typing one character
 * re-rendered the modal, which wiped the field. The title could never hold more
 * than a single character from any surface that did not pass the prop.
 * Hoisting the defaults gives them a stable identity across renders.
 */
const FALLBACK_STATUSES: Array<{ id: string; name: string }> = [
  { id: 'status-todo', name: 'To Do' },
  { id: 'status-in-progress', name: 'In Progress' },
  { id: 'status-done', name: 'Done' },
];

const FALLBACK_TYPES: Array<{ id: string; name: string }> = TASK_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
}));

export function QuickCreateModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  initialStatusId = 'status-todo',
  availableStatuses = FALLBACK_STATUSES,
  availableTypes = FALLBACK_TYPES,
  onSuccess,
  onItemCreated,
  onItemReconciled,
  onCreateFailed,
}: QuickCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(initialStatusId);
  const [typeId, setTypeId] = useState(availableTypes[0]?.id || 'type-task');
  const [priority, setPriority] = useState<number>(1);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Resets only on open. Including the prop values here would clear the form
  // mid-typing whenever a parent re-rendered with a new array identity.
  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setStatusId(initialStatusId || availableStatuses[0]?.id || 'status-todo');
    setPriority(1);
    setDueDate('');
    const timer = setTimeout(() => titleInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

    // Show the card immediately, then reconcile with the stored row.
    if (onSuccess) onSuccess(optimisticItem);
    if (onItemCreated) onItemCreated(optimisticItem);
    onClose();

    /**
     * The response is read and checked.
     *
     * This previously awaited the fetch and threw the body away, so the board
     * kept the placeholder id and the random sequence forever. Every later edit
     * then PATCHed /api/work-items/wi-1757… , which matches no row, and the
     * change was lost (section 10, "Stale data"). A rejected write was also
     * invisible, because the catch was empty (section 3.4).
     */
    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          type_id: typeId,
          status_id: statusId,
          title: optimisticItem.title,
          description: optimisticItem.description,
          priority,
          due_date: dueDate || null,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        onCreateFailed?.(optimisticItem, payload?.error ?? 'Could not save the task.');
        return;
      }

      // Swap the placeholder for the stored row so its real id and sequence win.
      if (payload?.workItem) {
        onItemReconciled?.(optimisticItem.id, payload.workItem as WorkItemData);
      }
    } catch {
      onCreateFailed?.(optimisticItem, 'Could not reach the server. The task was not saved.');
    } finally {
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
          box-shadow: 0 0 0 3px rgba(155, 140, 255, 0.2);
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
          border-color: rgba(155, 140, 255, 0.4);
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
          color: var(--nx-on-accent);
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
          box-shadow: 0 4px 14px rgba(155, 140, 255, 0.4);
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
