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
}

interface StatusColumn {
  id: string;
  name: string;
  category: string;
  position: number;
  color?: string;
}

const DEFAULT_STATUSES: StatusColumn[] = [
  { id: 'status-todo', name: 'To Do', category: 'todo', position: 0, color: '#6366F1' },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1, color: '#8B5CF6' },
  { id: 'status-done', name: 'Done', category: 'done', position: 2, color: '#10B981' },
];

export function KanbanBoard({
  workspaceId,
  projectId,
  projectName = 'Main Project',
  projectKey = 'PRJ',
  projectMode = 'advanced',
  initialItems = [],
}: KanbanBoardProps) {
  const [items, setItems] = useState<WorkItemData[]>(initialItems);
  const [statuses, setStatuses] = useState<StatusColumn[]>(DEFAULT_STATUSES);
  const [types, setTypes] = useState<Array<{ id: string; name: string }>>([
    { id: 'type-task', name: 'Task' },
    { id: 'type-bug', name: 'Bug' },
    { id: 'type-feature', name: 'Feature' },
  ]);

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Modals & Drawers
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [activeStatusForCreate, setActiveStatusForCreate] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WorkItemData | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Sync initial items when changed
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  // Load live data from API
  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/work-items?projectId=${projectId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setItems(data.items);
      }
      if (data.statuses && data.statuses.length > 0) {
        setStatuses(data.statuses);
      }
      if (data.types && data.types.length > 0) {
        setTypes(data.types);
      }
    } catch {}
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

  // Filter items based on search and priority
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
      return true;
    });
  }, [items, searchQuery, selectedPriority, projectKey]);

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

    // Optimistic client update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status_id: targetStatusId } : item
      )
    );

    // Save to API
    try {
      await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: targetStatusId }),
      });
    } catch {}
  };

  const handleStatusChange = async (itemId: string, newStatusId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status_id: newStatusId } : item
      )
    );
    try {
      await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: newStatusId }),
      });
    } catch {}
  };

  const handleCreateSuccess = (newItem: WorkItemData) => {
    setItems((prev) => [newItem, ...prev]);
    setIsQuickCreateOpen(false);
  };

  return (
    <div className="board-root">
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
                  colItems.map((item) => (
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
                        typeName={types[0]?.name || 'Task'}
                        assignees={item.assignees}
                        onClick={() => setSelectedItem(item)}
                        onStatusChange={(newSt) => handleStatusChange(item.id, newSt)}
                        availableStatuses={statuses}
                      />
                    </div>
                  ))
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
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 6px 12px;
          width: 240px;
        }

        .board-search__input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.8125rem;
          color: var(--color-text-primary);
          width: 100%;
        }

        .priority-filters {
          display: flex;
          gap: 4px;
        }

        .filter-pill {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-pill:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .filter-pill--active {
          background: var(--color-surface-active);
          color: var(--color-primary);
          border-color: var(--color-border-accent);
          font-weight: 600;
        }

        .board-controls__right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          color: var(--color-text-secondary);
          cursor: pointer;
        }

        .icon-btn--active {
          color: var(--color-primary);
          border-color: var(--color-border-accent);
        }

        .btn-create {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--color-primary);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-create:hover {
          background: var(--color-primary-hover);
          transform: translateY(-1px);
        }

        /* Columns Grid */
        .board-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          flex: 1;
          align-items: flex-start;
          overflow-x: auto;
          padding-bottom: 20px;
        }

        .board-column {
          background: var(--color-bg-subtle);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 480px;
          transition: all var(--transition-fast);
        }

        .board-column--dragover {
          border-color: var(--color-primary);
          background: var(--color-surface-active);
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
        }

        .column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 6px 8px;
        }

        .column-header__info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .column-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .column-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-primary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .column-count {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--color-text-tertiary);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          padding: 1px 6px;
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
          color: var(--color-text-tertiary);
          cursor: pointer;
        }

        .column-add-btn:hover {
          background: var(--color-surface);
          color: var(--color-text-primary);
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
          border: 2px dashed var(--color-border);
          border-radius: 10px;
          padding: 32px 16px;
          text-align: center;
          color: var(--color-text-tertiary);
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
