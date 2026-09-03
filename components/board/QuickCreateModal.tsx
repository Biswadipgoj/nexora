'use client';

import React, { useState, useEffect } from 'react';

export interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  statuses: Array<{ id: string; name: string }>;
  types: Array<{ id: string; name: string }>;
  onCreated: (newItem: any) => void;
}

export function QuickCreateModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  statuses,
  types,
  onCreated,
}: QuickCreateModalProps) {
  const [title, setTitle] = useState('');
  const [statusId, setStatusId] = useState(statuses[0]?.id ?? '');
  const [typeId, setTypeId] = useState(types[0]?.id ?? '');
  const [priority, setPriority] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (statuses.length > 0 && !statusId) setStatusId(statuses[0].id);
    if (types.length > 0 && !typeId) setTypeId(types[0].id);
  }, [statuses, types, statusId, typeId]);

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

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !statusId || !typeId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          type_id: typeId,
          status_id: statusId,
          title: title.trim(),
          priority,
          due_date: dueDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create work item');
      }

      setTitle('');
      setDueDate('');
      setPriority(0);
      onCreated(data.workItem);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating work item');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="quick-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="quick-create-title">
      <div className="quick-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quick-modal-header">
          <h3 id="quick-create-title">Create Work Item</h3>
          <button type="button" className="quick-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {error && (
          <div className="quick-modal-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="quick-modal-form">
          <div className="quick-modal-field">
            <label htmlFor="qc-title">Title</label>
            <input
              id="qc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
              maxLength={500}
              className="quick-modal-input"
            />
          </div>

          <div className="quick-modal-grid">
            <div className="quick-modal-field">
              <label htmlFor="qc-type">Type</label>
              <select
                id="qc-type"
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="quick-modal-select"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="quick-modal-field">
              <label htmlFor="qc-status">Status</label>
              <select
                id="qc-status"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="quick-modal-select"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="quick-modal-grid">
            <div className="quick-modal-field">
              <label htmlFor="qc-priority">Priority</label>
              <select
                id="qc-priority"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="quick-modal-select"
              >
                <option value={0}>None</option>
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
                <option value={4}>Urgent</option>
              </select>
            </div>

            <div className="quick-modal-field">
              <label htmlFor="qc-due">Due date</label>
              <input
                id="qc-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="quick-modal-input"
              />
            </div>
          </div>

          <div className="quick-modal-actions">
            <button type="button" className="quick-modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()} className="quick-modal-btn-submit">
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .quick-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);
          padding: var(--space-4);
        }

        .quick-modal-content {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 500px;
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
        }

        .quick-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }

        .quick-modal-header h3 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .quick-modal-close {
          font-size: var(--font-size-base);
          color: var(--color-text-tertiary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }

        .quick-modal-close:hover {
          color: var(--color-text-primary);
          background: var(--color-surface-hover);
        }

        .quick-modal-error {
          background: var(--color-danger-subtle);
          color: var(--color-danger-text);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          margin-bottom: var(--space-3);
        }

        .quick-modal-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .quick-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }

        .quick-modal-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .quick-modal-field label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
        }

        .quick-modal-input,
        .quick-modal-select {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          transition: border-color var(--transition-fast);
        }

        .quick-modal-input:focus,
        .quick-modal-select:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: var(--shadow-focus);
        }

        .quick-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }

        .quick-modal-btn-cancel {
          padding: var(--space-2) var(--space-4);
          color: var(--color-text-secondary);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .quick-modal-btn-cancel:hover {
          background: var(--color-surface-hover);
        }

        .quick-modal-btn-submit {
          padding: var(--space-2) var(--space-4);
          background: var(--color-accent);
          color: var(--color-text-on-primary);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          transition: background var(--transition-fast);
        }

        .quick-modal-btn-submit:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }

        .quick-modal-btn-submit:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
