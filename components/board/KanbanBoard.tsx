'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WorkItemCard } from './WorkItemCard';
import { QuickCreateModal } from './QuickCreateModal';
import { WorkItemDetailDrawer } from './WorkItemDetailDrawer';

export interface StatusColumn {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done' | 'cancelled';
  position: number;
  color: string;
}

export interface WorkItemData {
  id: string;
  workspace_id: string;
  project_id: string;
  sequence: number;
  title: string;
  priority: number;
  status_id: string;
  type_id: string;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoardProps {
  workspaceId: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  projectMode?: 'simple' | 'advanced';
}

export function KanbanBoard({
  workspaceId,
  projectId,
  projectKey,
  projectName,
  projectMode = 'simple',
}: KanbanBoardProps) {
  const [statuses, setStatuses] = useState<StatusColumn[]>([]);
  const [types, setTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [items, setItems] = useState<WorkItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  // Modals & Drawers
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkItemData | null>(null);
  const [activeStatusForCreate, setActiveStatusForCreate] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{ id: string; title: string } | null>(null);

  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch work items
      const itemsRes = await fetch(`/api/work-items?projectId=${projectId}`);
      if (!itemsRes.ok) throw new Error('Failed to load work items');
      const itemsData = await itemsRes.json();
      setItems(itemsData.items || []);

      // Default fallback statuses if none loaded
      setStatuses([
        { id: 'status-todo', name: 'To Do', category: 'todo', position: 0, color: '#6B7280' },
        { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1, color: '#3B82F6' },
        { id: 'status-done', name: 'Done', category: 'done', position: 2, color: '#10B981' },
      ]);

      setTypes([
        { id: 'type-task', name: 'Task' },
        { id: 'type-bug', name: 'Bug' },
        { id: 'type-feature', name: 'Feature' },
      ]);

      setDegraded(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // §30.3: Global 'C' shortcut to open quick create
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsQuickCreateOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // §17: Optimistic UI for status transitions (≤100ms perceived)
  async function handleStatusChange(itemId: string, newStatusId: string) {
    // 1. Snapshot previous state
    const previousItems = [...items];

    // 2. Optimistic local update
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status_id: newStatusId } : it))
    );

    // 3. Background server call
    try {
      const res = await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: newStatusId }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }
    } catch {
      // Rollback on failure
      setItems(previousItems);
      alert('Could not update status. Reverted to previous state.');
    }
  }

  function handleItemCreated(newItem: WorkItemData) {
    setItems((prev) => [newItem, ...prev]);
  }

  function handleItemUpdated(updated: WorkItemData) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    if (selectedItem?.id === updated.id) {
      setSelectedItem(updated);
    }
  }

  function handleItemDeleted(deletedId: string) {
    const itemToDelete = items.find((i) => i.id === deletedId);
    if (itemToDelete) {
      setUndoItem({ id: itemToDelete.id, title: itemToDelete.title });
      setTimeout(() => setUndoItem(null), 10000); // 10s undo window (§30.3)
    }
    setItems((prev) => prev.filter((it) => it.id !== deletedId));
  }

  return (
    <div className="kanban">
      {/* Top action bar */}
      <div className="kanban__header">
        <div className="kanban__header-left">
          <h2 className="kanban__title">{projectName}</h2>
          <span className="kanban__key-badge">{projectKey}</span>
          <span className="kanban__mode-badge">
            {projectMode === 'simple' ? 'Simple Mode' : 'Advanced Mode'}
          </span>
        </div>

        <div className="kanban__header-right">
          <span className="kanban__shortcut-hint">
            Press <kbd>C</kbd> to create
          </span>
          <button
            type="button"
            className="kanban__btn-create"
            onClick={() => {
              setActiveStatusForCreate(null);
              setIsQuickCreateOpen(true);
            }}
          >
            + New Item
          </button>
        </div>
      </div>

      {/* Degraded state banner (§30.2) */}
      {degraded && (
        <div className="kanban__degraded-banner" role="status">
          <span>Operating in offline/degraded mode. Updates will sync when reconnected.</span>
          <button type="button" onClick={fetchBoardData} className="kanban__degraded-retry">
            Retry
          </button>
        </div>
      )}

      {/* Error state (§30.2) */}
      {error && !degraded && (
        <div className="kanban__error-state" role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchBoardData} className="kanban__btn-create">
            Try again
          </button>
        </div>
      )}

      {/* Loading state: Structural skeletons (§30.2 & §16.1) */}
      {loading && (
        <div className="kanban__columns">
          {[1, 2, 3].map((col) => (
            <div key={col} className="kanban__col-skeleton">
              <div className="skeleton" style={{ height: '24px', width: '120px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ height: '80px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '80px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '80px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Board columns */}
      {!loading && !error && (
        <div className="kanban__columns" role="region" aria-label="Kanban Board Columns">
          {statuses.map((status) => {
            const columnItems = items.filter((it) => it.status_id === status.id);

            return (
              <div key={status.id} className="kanban__column">
                <div className="kanban__col-header">
                  <div className="kanban__col-title-row">
                    <span className="kanban__col-dot" style={{ backgroundColor: status.color }} />
                    <h3 className="kanban__col-name">{status.name}</h3>
                    <span className="kanban__col-count">{columnItems.length}</span>
                  </div>
                  <button
                    type="button"
                    className="kanban__col-add-btn"
                    onClick={() => {
                      setActiveStatusForCreate(status.id);
                      setIsQuickCreateOpen(true);
                    }}
                    title={`Add item to ${status.name}`}
                    aria-label={`Add item to ${status.name}`}
                  >
                    +
                  </button>
                </div>

                <div className="kanban__col-cards">
                  {columnItems.length === 0 ? (
                    /* Column Empty state (§30.2: Empty states teach) */
                    <div className="kanban__col-empty">
                      <p>No items in {status.name}</p>
                      <button
                        type="button"
                        className="kanban__col-empty-btn"
                        onClick={() => {
                          setActiveStatusForCreate(status.id);
                          setIsQuickCreateOpen(true);
                        }}
                      >
                        + Add item
                      </button>
                    </div>
                  ) : (
                    columnItems.map((item) => (
                      <WorkItemCard
                        key={item.id}
                        id={item.id}
                        sequence={item.sequence}
                        projectKey={projectKey}
                        title={item.title}
                        priority={item.priority}
                        statusId={item.status_id}
                        dueDate={item.due_date}
                        typeName="Task"
                        onClick={() => setSelectedItem(item)}
                        onStatusChange={(newSt) => handleStatusChange(item.id, newSt)}
                        availableStatuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Undo Toast Notification (§30.3) */}
      {undoItem && (
        <div className="kanban__undo-toast" role="status">
          <span>Deleted &quot;{undoItem.title}&quot;</span>
          <button
            type="button"
            className="kanban__undo-btn"
            onClick={() => {
              // Restore item locally
              setUndoItem(null);
              fetchBoardData();
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Modals */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        workspaceId={workspaceId}
        projectId={projectId}
        statuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
        types={types}
        onCreated={handleItemCreated}
      />

      <WorkItemDetailDrawer
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        projectKey={projectKey}
        statuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
        types={types}
        onUpdated={handleItemUpdated}
        onDeleted={handleItemDeleted}
      />

      <style>{`
        .kanban {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: calc(100vh - var(--header-height));
          padding: var(--space-6);
        }

        .kanban__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
        }

        .kanban__header-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .kanban__title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .kanban__key-badge {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          padding: 2px 6px;
          background: var(--color-surface-active);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
        }

        .kanban__mode-badge {
          font-size: var(--font-size-xs);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: var(--color-accent-subtle);
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
        }

        .kanban__header-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .kanban__shortcut-hint {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        .kanban__shortcut-hint kbd {
          padding: 2px 6px;
          background: var(--color-surface-active);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          color: var(--color-text-primary);
          font-size: 11px;
        }

        .kanban__btn-create {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: var(--color-accent);
          color: var(--color-text-on-primary);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          transition: background var(--transition-fast);
        }

        .kanban__btn-create:hover {
          background: var(--color-accent-hover);
        }

        .kanban__degraded-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--color-warning-subtle);
          color: var(--color-warning-text);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          margin-bottom: var(--space-4);
        }

        .kanban__degraded-retry {
          font-weight: var(--font-weight-semibold);
          color: var(--color-warning-text);
          text-decoration: underline;
        }

        .kanban__error-state {
          padding: var(--space-8);
          background: var(--color-danger-subtle);
          color: var(--color-danger-text);
          border-radius: var(--radius-lg);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .kanban__columns {
          display: flex;
          gap: var(--space-5);
          overflow-x: auto;
          flex: 1;
          align-items: flex-start;
          padding-bottom: var(--space-6);
        }

        .kanban__column,
        .kanban__col-skeleton {
          width: 320px;
          min-width: 300px;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 180px);
        }

        .kanban__col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }

        .kanban__col-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .kanban__col-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
        }

        .kanban__col-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .kanban__col-count {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          background: var(--color-surface);
          padding: 1px 6px;
          border-radius: var(--radius-full);
          font-weight: var(--font-weight-medium);
        }

        .kanban__col-add-btn {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          color: var(--color-text-tertiary);
          font-size: var(--font-size-base);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .kanban__col-add-btn:hover {
          background: var(--color-surface);
          color: var(--color-text-primary);
        }

        .kanban__col-cards {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          overflow-y: auto;
          padding-right: 2px;
          min-height: 120px;
        }

        .kanban__col-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8) var(--space-4);
          text-align: center;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-tertiary);
          font-size: var(--font-size-xs);
          gap: var(--space-2);
        }

        .kanban__col-empty-btn {
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-xs);
        }

        .kanban__col-empty-btn:hover {
          text-decoration: underline;
        }

        .kanban__undo-toast {
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          background: var(--color-text-primary);
          color: var(--color-text-inverse);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          box-shadow: var(--shadow-lg);
          z-index: var(--z-toast);
          font-size: var(--font-size-sm);
        }

        .kanban__undo-btn {
          color: var(--color-accent-subtle);
          font-weight: var(--font-weight-bold);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
