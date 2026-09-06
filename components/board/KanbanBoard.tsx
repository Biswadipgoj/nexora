'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkItemCard } from './WorkItemCard';
import { QuickCreateModal } from './QuickCreateModal';
import { WorkItemDetailDrawer } from './WorkItemDetailDrawer';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ViewWeekRoundedIcon from '@mui/icons-material/ViewWeekRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import { TASK_CATEGORIES, getCategoryByIdOrName } from '@/lib/constants/categories';

export interface WorkItemData {
  id: string;
  sequence?: number;
  project_id?: string;
  workspace_id?: string;
  title: string;
  description?: any;
  priority?: number;
  status_id?: string;
  type_id?: string;
  start_date?: string | null;
  due_date?: string | null;
  estimate?: number | null;
  assignees?: any[];
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface KanbanBoardProps {
  workspaceId: string;
  projectId: string;
  projectName?: string;
  projectKey?: string;
  projectMode?: 'simple' | 'advanced';
  initialItems?: WorkItemData[];
  /**
   * Lets an embedding surface stay in step with the board.
   *
   * Without this the Overview board and the priority strip directly above it
   * diverged: a drag changed the board's private state, the strip kept the old
   * counts, and the next parent render pushed the stale list back into the
   * board (section 10, "Stale data").
   */
  onItemsChange?: (items: WorkItemData[]) => void;
}

interface StatusColumn {
  id: string;
  name: string;
  category: string;
  position: number;
  color?: string;
}

const DEFAULT_STATUSES: StatusColumn[] = [
  { id: 'status-todo', name: 'To Do', category: 'todo', position: 0, color: 'var(--nx-violet)' },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1, color: 'var(--nx-amber)' },
  { id: 'status-review', name: 'Code Review', category: 'in_progress', position: 2, color: 'var(--nx-cyan)' },
  { id: 'status-done', name: 'Done', category: 'done', position: 3, color: 'var(--nx-green)' },
];

export function KanbanBoard({
  workspaceId,
  projectId,
  projectName = 'Main Project',
  projectKey = 'PRJ',
  projectMode = 'advanced',
  initialItems = [],
  onItemsChange,
}: KanbanBoardProps) {
  const [items, setItems] = useState<WorkItemData[]>(initialItems);
  const [statuses, setStatuses] = useState<StatusColumn[]>(DEFAULT_STATUSES);
  const [types, setTypes] = useState<Array<{ id: string; name: string }>>(
    TASK_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Modals & Drawers
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [activeStatusForCreate, setActiveStatusForCreate] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WorkItemData | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  /** Section 3.4 — a refused move is reported, not swallowed. */
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Adopt the parent's list only when it genuinely differs.
   *
   * `initialItems` is a new array identity on most parent renders, so this
   * effect used to fire constantly and overwrite the board's own state —
   * a card dragged to another column snapped back the moment anything else on
   * the dashboard re-rendered. Comparing content instead of identity keeps
   * legitimate refreshes working without discarding local edits.
   */
  const initialSignature = useMemo(
    () => (initialItems ?? []).map((i) => `${i.id}:${i.status_id}:${i.updated_at ?? ''}`).join('|'),
    [initialItems]
  );

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) return;
    setItems((current) => {
      const currentSignature = current
        .map((i) => `${i.id}:${i.status_id}:${i.updated_at ?? ''}`)
        .join('|');
      return currentSignature === initialSignature ? current : initialItems;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSignature]);

  /** Report every board change upward so embedding surfaces stay in step. */
  const applyItems = useCallback(
    (updater: (prev: WorkItemData[]) => WorkItemData[]) => {
      setItems((prev) => {
        const next = updater(prev);
        onItemsChange?.(next);
        return next;
      });
    },
    [onItemsChange]
  );

  // Load live data from API
  /**
   * Loads the board.
   *
   * Two problems this fixes (section 3.4 — loading and error states must be
   * designed alongside the ideal state):
   * - a failed request silently rendered as an empty board, indistinguishable
   *   from a project with no work in it;
   * - results were applied only when non-empty, so deleting the last card left
   *   the stale one on screen until a full reload.
   */
  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/work-items?projectId=${projectId}`);
      if (!res.ok) throw new Error(String(res.status));

      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      if (data.statuses && data.statuses.length > 0) setStatuses(data.statuses);
      if (data.types && data.types.length > 0) setTypes(data.types);
      setMoveError(null);
    } catch {
      setMoveError('Could not load this board. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setActiveStatusForCreate(null);
        setIsQuickCreateOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter items based on search, priority, and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchKey = `${projectKey}-${item.sequence}`.toLowerCase().includes(q);
        if (!matchTitle && !matchKey) return false;
      }
      if (selectedPriority !== null && item.priority !== selectedPriority) {
        return false;
      }
      if (selectedCategory) {
        const itCat = getCategoryByIdOrName(item.type_id);
        if (itCat.id !== selectedCategory) {
          return false;
        }
      }
      return true;
    });
  }, [items, searchQuery, selectedPriority, selectedCategory, projectKey]);

  // Map items to columns
  const columnItemsMap = useMemo(() => {
    const map: Record<string, WorkItemData[]> = {};
    for (const col of statuses) {
      map[col.id] = [];
    }

    for (const item of filteredItems) {
      let colId = item.status_id;
      // Resolve status by category or name if ID doesn't directly match
      if (!map[colId || '']) {
        const found = statuses.find(
          (s) =>
            s.id === colId ||
            s.category.toLowerCase() === (colId || '').toLowerCase() ||
            (colId || '').includes(s.category)
        );
        colId = found ? found.id : statuses[0]?.id;
      }
      if (colId && map[colId]) {
        map[colId].push(item);
      } else if (statuses[0]) {
        map[statuses[0].id]?.push(item);
      }
    }
    return map;
  }, [filteredItems, statuses]);

  // Handle Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    setDraggedItemId(null);
    setDragOverColumnId(null);

    if (!itemId) return;
    await moveItem(itemId, targetStatusId);
  };

  /**
   * Moves a card and keeps the board honest about the outcome.
   *
   * The write was previously fire-and-forget inside an empty catch with no
   * `res.ok` check, so a rejected move stayed on screen and reverted on the
   * next reload — the card appeared to move and silently did not (section 3.4,
   * section 10 "Stale data").
   */
  const moveItem = async (itemId: string, targetStatusId: string) => {
    const previousStatusId = items.find((i) => i.id === itemId)?.status_id;
    if (previousStatusId === targetStatusId) return;

    applyItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status_id: targetStatusId } : item))
    );

    try {
      const res = await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: targetStatusId }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setMoveError(null);
    } catch {
      // Return the card to the column the server still has it in.
      applyItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status_id: previousStatusId } : item
        )
      );
      setMoveError('That move could not be saved. The card was put back.');
    }
  };

  const handleStatusChange = async (itemId: string, newStatusId: string) => {
    await moveItem(itemId, newStatusId);
  };

  const handleCreateSuccess = (newItem: WorkItemData) => {
    applyItems((prev) => [newItem, ...prev]);
    setIsQuickCreateOpen(false);
  };

  return (
    <div className="board-root">
      {/* Section 3.4 — a refused move or a failed load says so, with a retry. */}
      {moveError && (
        <div className="board-error" role="alert">
          <span>{moveError}</span>
          <button type="button" onClick={() => loadData()}>
            Retry
          </button>
        </div>
      )}

      {/* Board Top Controls & Filtering */}
      <div className="board-controls">
        <div className="board-controls__left">
          {/* Search Input */}
          <div className="board-search">
            <SearchRoundedIcon sx={{ fontSize: 16, color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              placeholder="Filter tasks by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="board-search__input"
            />
          </div>

          {/* Priority Quick Filter */}
          <div className="priority-filters">
            {[
              { label: 'All', value: null },
              { label: 'Urgent', value: 4 },
              { label: 'High', value: 3 },
              { label: 'Medium', value: 2 },
              { label: 'Low', value: 1 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => setSelectedPriority(p.value)}
                className={`filter-pill ${selectedPriority === p.value ? 'filter-pill--active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Category Quick Filter */}
          <div className="category-filter-wrap">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="category-filter-select"
              aria-label="Filter tasks by category"
            >
              <option value="">All Categories ({items.length})</option>
              {TASK_CATEGORIES.map((cat) => {
                const count = items.filter((it) => {
                  const itCat = getCategoryByIdOrName(it.type_id);
                  return itCat.id === cat.id;
                }).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.shortName} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="board-controls__right">
          {/* Density Toggle */}
          <button
            className={`icon-btn ${density === 'compact' ? 'icon-btn--active' : ''}`}
            onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
            title="Toggle Density"
          >
            {density === 'compact' ? (
              <TableRowsRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <ViewWeekRoundedIcon sx={{ fontSize: 16 }} />
            )}
          </button>

          {/* New Task Button */}
          <button
            className="btn-create"
            onClick={() => {
              setActiveStatusForCreate(null);
              setIsQuickCreateOpen(true);
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 16 }} />
            <span>Add Task</span>
            <kbd className="kbd-shortcut">C</kbd>
          </button>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="board-grid">
        {statuses.map((col) => {
          const colItems = columnItemsMap[col.id] || [];
          const isDragOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              className={`board-column ${isDragOver ? 'board-column--dragover' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="column-header">
                <div className="column-header__info">
                  <span
                    className="column-dot"
                    style={{ backgroundColor: col.color || 'var(--color-primary)' }}
                  />
                  <span className="column-title">{col.name}</span>
                  <span className="column-count">{colItems.length}</span>
                </div>

                <button
                  className="column-add-btn"
                  onClick={() => {
                    setActiveStatusForCreate(col.id);
                    setIsQuickCreateOpen(true);
                  }}
                  title={`Add task to ${col.name}`}
                  aria-label={`Add task to ${col.name}`}
                >
                  <AddRoundedIcon sx={{ fontSize: 16 }} />
                </button>
              </div>

              {/* Card List in Column */}
              <div className={`card-list card-list--${density}`}>
                {colItems.length === 0 ? (
                  <div className="column-empty-state">
                    <span>Drop tasks here</span>
                  </div>
                ) : (
                  colItems.map((item) => {
                    const itemCat = getCategoryByIdOrName(
                      item.type_id || types.find((t) => t.id === item.type_id)?.name
                    );
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                      >
                        <WorkItemCard
                          id={item.id}
                          sequence={item.sequence || 1}
                          projectKey={projectKey}
                          title={item.title}
                          priority={item.priority ?? 0}
                          statusId={col.id}
                          dueDate={item.due_date}
                          typeName={itemCat.name}
                          assignees={item.assignees}
                          onClick={() => setSelectedItem(item)}
                          onStatusChange={(newSt) => handleStatusChange(item.id, newSt)}
                          availableStatuses={statuses}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        workspaceId={workspaceId}
        projectId={projectId}
        initialStatusId={activeStatusForCreate || statuses[0]?.id || ''}
        availableStatuses={statuses}
        availableTypes={types}
        onSuccess={handleCreateSuccess}
      />

      {/* Task Detail Slide-Over Drawer */}
      <WorkItemDetailDrawer
        item={selectedItem}
        statuses={statuses}
        types={types}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        projectKey={projectKey}
        onUpdateItem={(updated) => {
          setItems((prev) =>
            prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
          );
          setSelectedItem((prev) => (prev ? { ...prev, ...updated } : null));
        }}
        onDeleteItem={(deletedId) => {
          setItems((prev) => prev.filter((it) => it.id !== deletedId));
          setSelectedItem(null);
        }}
      />

      <style jsx>{`
        .board-root {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          gap: 16px;
        }

        .board-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 8px 0;
        }

        .board-controls__left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .board-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--nx-bg-raised);
          border: 1px solid var(--nx-border);
          border-radius: 12px;
          padding: 7px 14px;
          width: 260px;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.21);
          backdrop-filter: blur(20px);
          transition: all 0.2s ease;
        }

        .board-search:focus-within {
          border-color: var(--aurora-iris);
          box-shadow: 0 0 18px rgba(155, 140, 255, 0.35), inset 0 1px 2px rgba(0, 0, 0, 0.16);
        }

        .board-search__input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-main);
          width: 100%;
        }

        .priority-filters {
          display: flex;
          gap: 6px;
        }

        .filter-pill {
          background: var(--nx-bg-raised);
          border: 1px solid var(--nx-border);
          color: var(--text-main);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .filter-pill:hover {
          background: var(--nx-surface);
          border-color: var(--nx-border-strong);
          transform: translateY(-1px);
        }

        .filter-pill--active {
          background: linear-gradient(135deg, var(--nx-violet), var(--nx-violet));
          color: var(--nx-on-accent);
          border-color: var(--nx-border-strong);
          box-shadow: 0 4px 14px rgba(155, 140, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .category-filter-wrap {
          display: flex;
          align-items: center;
        }

        .category-filter-select {
          background: var(--nx-surface);
          border: 1px solid var(--nx-border);
          color: var(--text-main);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          backdrop-filter: blur(12px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
          transition: all 0.2s ease;
        }

        .category-filter-select:hover,
        .category-filter-select:focus {
          background: var(--nx-surface-2);
          border-color: var(--nx-violet);
          box-shadow: 0 0 0 3px rgba(155, 140, 255, 0.15);
        }

        .board-controls__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--nx-bg-raised);
          border: 1px solid var(--nx-border);
          border-radius: 10px;
          color: var(--text-main);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
          transition: all 0.2s ease;
        }

        .icon-btn:hover {
          background: var(--nx-surface);
          border-color: var(--nx-border-strong);
          transform: translateY(-1px);
        }

        .icon-btn--active {
          color: var(--nx-cyan);
          border-color: var(--nx-cyan);
          box-shadow: 0 0 14px rgba(70, 215, 232, 0.4);
        }

        .btn-create {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, var(--nx-violet) 0%, var(--nx-violet) 50%, var(--nx-cyan) 100%);
          color: var(--nx-on-accent);
          border: 1px solid var(--nx-border);
          border-radius: 9999px;
          padding: 8px 18px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(155, 140, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-create:hover {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 8px 24px rgba(155, 140, 255, 0.6), inset 0 1.5px 0 rgba(255, 255, 255, 0.05);
        }

        /* Columns Grid */
        .board-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 18px;
          flex: 1;
          align-items: flex-start;
          overflow-x: auto;
          padding-bottom: 20px;
        }

        .board-column {
          background: var(--nx-bg-raised);
          border: 1px solid var(--nx-border);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 520px;
          backdrop-filter: blur(28px) saturate(220%) brightness(106%);
          -webkit-backdrop-filter: blur(28px) saturate(220%) brightness(106%);
          box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.31), inset 0 1.5px 0 0 rgba(255, 255, 255, 0.05);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .board-column--dragover {
          border-color: var(--aurora-iris);
          background: var(--nx-surface);
          box-shadow: 0 0 32px rgba(155, 140, 255, 0.4), inset 0 1.5px 0 0 rgba(255, 255, 255, 0.05);
          transform: scale(1.015);
        }

        .column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 6px 10px;
          border-bottom: 1px solid var(--nx-border);
          margin-bottom: 4px;
        }

        .column-header__info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .column-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }

        .column-title {
          font-size: 0.8125rem;
          font-weight: 800;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .column-count {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 800;
          color: var(--text-main);
          background: var(--nx-surface);
          border: 1px solid var(--nx-border);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .column-add-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
        }

        .column-add-btn:hover {
          background: var(--nx-bg-raised);
          color: var(--text-main);
        }

        .card-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .card-list--compact {
          gap: 6px;
        }

        .column-empty-state {
          border: 2px dashed var(--nx-border-strong);
          border-radius: 12px;
          padding: 32px 16px;
          text-align: center;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
