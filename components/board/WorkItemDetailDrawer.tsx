'use client';

import React, { useState, useEffect } from 'react';

export interface WorkItemDetailDrawerProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  projectKey: string;
  statuses: Array<{ id: string; name: string }>;
  types: Array<{ id: string; name: string }>;
  onUpdated: (updatedItem: any) => void;
  onDeleted: (deletedItemId: string) => void;
}

export function WorkItemDetailDrawer({
  item,
  isOpen,
  onClose,
  projectKey,
  statuses,
  types,
  onUpdated,
  onDeleted,
}: WorkItemDetailDrawerProps) {
  const [title, setTitle] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [typeId, setTypeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setStatusId(item.status_id || '');
      setPriority(item.priority || 0);
      setDueDate(item.due_date || '');
      setTypeId(item.type_id || '');
    }
  }, [item]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  async function handleFieldSave(updates: Record<string, any>) {
    if (!item) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdated(data.item);
      }
    } catch {
      // rollback or alert
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm('Are you sure you want to delete this item? You can undo this action within 10 seconds.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted(item.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-key-badge">
            {projectKey}-{item.sequence}
          </div>
          <div className="drawer-header-actions">
            {saving && <span className="drawer-status-saving">Saving...</span>}
            <button
              type="button"
              className="drawer-btn-danger"
              onClick={handleDelete}
              disabled={deleting}
              title="Soft delete item"
            >
              Delete
            </button>
            <button type="button" className="drawer-btn-close" onClick={onClose} aria-label="Close details">
              ✕
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {/* Title inline editor */}
          <div className="drawer-title-section">
            <input
              id="drawer-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== item.title) {
                  handleFieldSave({ title: title.trim() });
                }
              }}
              className="drawer-title-input"
              placeholder="Task title..."
            />
          </div>

          <div className="drawer-grid">
            <div className="drawer-prop">
              <label htmlFor="drawer-status-select">Status</label>
              <select
                id="drawer-status-select"
                value={statusId}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusId(val);
                  handleFieldSave({ status_id: val });
                }}
                className="drawer-select"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="drawer-prop">
              <label htmlFor="drawer-priority-select">Priority</label>
              <select
                id="drawer-priority-select"
                value={priority}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPriority(val);
                  handleFieldSave({ priority: val });
                }}
                className="drawer-select"
              >
                <option value={0}>None</option>
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
                <option value={4}>Urgent</option>
              </select>
            </div>

            <div className="drawer-prop">
              <label htmlFor="drawer-type-select">Type</label>
              <select
                id="drawer-type-select"
                value={typeId}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypeId(val);
                  handleFieldSave({ type_id: val });
                }}
                className="drawer-select"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="drawer-prop">
              <label htmlFor="drawer-due-date">Due date</label>
              <input
                id="drawer-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setDueDate(val);
                  handleFieldSave({ due_date: val || null });
                }}
                className="drawer-input"
              />
            </div>
          </div>

          <div className="drawer-meta-section">
            <h4>Details</h4>
            <div className="drawer-meta-row">
              <span>Created</span>
              <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</span>
            </div>
            <div className="drawer-meta-row">
              <span>Last updated</span>
              <span>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: var(--z-modal);
          display: flex;
          justify-content: flex-end;
        }

        .drawer-panel {
          background: var(--color-surface);
          width: 100%;
          max-width: var(--detail-panel-width);
          height: 100vh;
          box-shadow: var(--shadow-lg);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          animation: slide-in 200ms ease;
        }

        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .drawer-key-badge {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          padding: 2px 8px;
          background: var(--color-surface-active);
          border-radius: var(--radius-sm);
        }

        .drawer-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .drawer-status-saving {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        .drawer-btn-danger {
          font-size: var(--font-size-xs);
          color: var(--color-danger);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }

        .drawer-btn-danger:hover {
          background: var(--color-danger-subtle);
        }

        .drawer-btn-close {
          font-size: var(--font-size-base);
          color: var(--color-text-tertiary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }

        .drawer-btn-close:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .drawer-body {
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .drawer-title-input {
          width: 100%;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          padding: var(--space-1) var(--space-2);
          color: var(--color-text-primary);
          background: transparent;
          transition: border-color var(--transition-fast);
        }

        .drawer-title-input:hover,
        .drawer-title-input:focus {
          border-color: var(--color-border);
          background: var(--color-surface);
        }

        .drawer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          background: var(--color-surface-hover);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
        }

        .drawer-prop {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .drawer-prop label {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          font-weight: var(--font-weight-medium);
        }

        .drawer-select,
        .drawer-input {
          padding: var(--space-1) var(--space-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-xs);
        }

        .drawer-meta-section {
          border-top: 1px solid var(--color-border-subtle);
          padding-top: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .drawer-meta-section h4 {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-1);
        }

        .drawer-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
