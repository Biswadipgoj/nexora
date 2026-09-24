'use client';

import React, { useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { TASK_CATEGORIES } from '@/lib/constants/categories';
import { categorySwatch, PRIORITY_LABELS, PRIORITY_OPTIONS } from '@/lib/work/display';
import type { WorkItemData } from '@/lib/work/types';
import './board.css';

export interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  projectName?: string;
  initialStatusId?: string;
  initialTypeId?: string;
  initialPriority?: number;
  availableStatuses?: Array<{ id: string; name: string; category?: string }>;
  onSuccess?: (newItem: WorkItemData) => void;
  onItemCreated?: (newItem: WorkItemData) => void;
  /** Replaces the optimistic placeholder with the row the server actually stored. */
  onItemReconciled?: (optimisticId: string, storedItem: WorkItemData) => void;
  /** The write was rejected — the caller should withdraw the optimistic card. */
  onCreateFailed?: (optimisticItem: WorkItemData, message: string) => void;
}

/**
 * Module-level constants, NOT inline default parameters: an inline default
 * array is rebuilt every render, which once made the form reset on each
 * keystroke. The form itself is remounted per opening (the caller changes its
 * `key`), so fields start clean without a reset effect.
 */
const FALLBACK_STATUSES: Array<{ id: string; name: string; category?: string }> = [
  { id: 'status-todo', name: 'To Do', category: 'todo' },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress' },
  { id: 'status-done', name: 'Done', category: 'done' },
];

export function QuickCreateModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  projectName,
  initialStatusId = 'status-todo',
  initialTypeId = 'type-task',
  initialPriority = 2,
  availableStatuses = FALLBACK_STATUSES,
  onSuccess,
  onItemCreated,
  onItemReconciled,
  onCreateFailed,
}: QuickCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(
    availableStatuses.some((s) => s.id === initialStatusId) ? initialStatusId : availableStatuses[0]?.id ?? 'status-todo'
  );
  const [typeId, setTypeId] = useState(initialTypeId);
  const [priority, setPriority] = useState<number>(initialPriority);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus the title whenever the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => titleRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || submitting) return;
    setSubmitting(true);

    const status = availableStatuses.find((s) => s.id === statusId);
    const optimisticItem: WorkItemData = {
      id: `wi-${Date.now()}`,
      workspace_id: workspaceId,
      project_id: projectId,
      type_id: typeId,
      status_id: statusId,
      status_category: status?.category ?? null,
      title: cleanTitle,
      description: description.trim() ? { ops: [{ insert: `${description.trim()}\n` }] } : null,
      priority,
      due_date: dueDate || null,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Show the card at once, then reconcile it with the stored row.
    onSuccess?.(optimisticItem);
    onItemCreated?.(optimisticItem);
    onClose();

    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          type_id: typeId,
          status_id: statusId,
          title: cleanTitle,
          priority,
          // Empty optional fields are left out rather than sent as null.
          ...(optimisticItem.description ? { description: optimisticItem.description } : {}),
          ...(dueDate ? { due_date: dueDate } : {}),
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        onCreateFailed?.(optimisticItem, payload?.error ?? 'Could not save the task.');
        return;
      }

      if (payload?.workItem) onItemReconciled?.(optimisticItem.id, payload.workItem as WorkItemData);
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
      aria-labelledby="quick-create-title"
    >
      <form onSubmit={handleSubmit}>
        <div className="nx-sheet-head">
          <div>
            <p className="nx-eyebrow" id="quick-create-title">
              New task{projectName ? ` · ${projectName}` : ''}
            </p>
          </div>
          <button type="button" className="nx-icon-btn" onClick={onClose} aria-label="Close">
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="nx-sheet-body">
          <div className="nx-field">
            <label htmlFor="qc-title" className="nx-visually-hidden">
              Title
            </label>
            <input
              id="qc-title"
              ref={titleRef}
              className="qc-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              autoComplete="off"
              required
            />
            <label htmlFor="qc-desc" className="nx-visually-hidden">
              Description
            </label>
            <textarea
              id="qc-desc"
              className="qc-desc"
              placeholder="Add detail, links or acceptance criteria (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleSubmit();
              }}
              rows={2}
            />
          </div>

          <div className="qc-rule" />

          <div className="nx-field">
            <span className="nx-label" id="qc-category-label">
              Category
            </span>
            <div className="qc-categories" role="group" aria-labelledby="qc-category-label">
              {TASK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="qc-category"
                  aria-pressed={typeId === cat.id}
                  onClick={() => setTypeId(cat.id)}
                  title={cat.description}
                >
                  <span className="nx-category__swatch" style={{ background: categorySwatch(cat.id) }} aria-hidden="true" />
                  {cat.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className="qc-props">
            <div className="nx-field">
              <label htmlFor="qc-status" className="nx-label">
                Status
              </label>
              <select id="qc-status" className="nx-select" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                {availableStatuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="nx-field">
              <label htmlFor="qc-priority" className="nx-label">
                Priority
              </label>
              <select
                id="qc-priority"
                className="nx-select"
                value={priority}
                onChange={(e) => setPriority(Number.parseInt(e.target.value, 10))}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="nx-field">
              <label htmlFor="qc-due" className="nx-label">
                Due date
              </label>
              <input id="qc-due" type="date" className="nx-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="nx-sheet-foot">
          <span className="nx-sheet-foot__hint">
            <kbd className="nx-kbd">↵</kbd> create · <kbd className="nx-kbd">esc</kbd> close
          </span>
          <div className="nx-sheet-foot__actions">
            <button type="button" className="nx-btn nx-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="nx-btn nx-btn--primary" disabled={!title.trim() || submitting}>
              Create task
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
