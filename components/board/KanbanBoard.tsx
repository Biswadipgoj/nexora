'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import { WorkItemCard } from './WorkItemCard';
import { QuickCreateModal } from './QuickCreateModal';
import { WorkItemDetailDrawer } from './WorkItemDetailDrawer';
import { TASK_CATEGORIES } from '@/lib/constants/categories';
import { categoryOf, statusTone } from '@/lib/work/display';
import { isDone } from '@/lib/work/focus';
import type { StatusColumn, WorkItemData } from '@/lib/work/types';
import './board.css';

export type { WorkItemData } from '@/lib/work/types';

export interface KanbanBoardProps {
  workspaceId: string;
  projectId: string;
  projectName?: string;
  projectKey?: string;
  projectMode?: 'simple' | 'advanced';
  initialItems?: WorkItemData[];
  /**
   * Lets an embedding surface stay in step with the board. Without it the
   * Overview metrics and the board above them diverged after a drag.
   */
  onItemsChange?: (items: WorkItemData[]) => void;
  /** Handle the "C" shortcut here. Off when the page owns the shortcut. */
  enableShortcuts?: boolean;
}

/** Must stay in step with the API's DEFAULT_STATUSES (app/api/work-items). */
const DEFAULT_STATUSES: StatusColumn[] = [
  { id: 'status-todo', name: 'To Do', category: 'todo', position: 0 },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1 },
  { id: 'status-review', name: 'Code Review', category: 'in_progress', position: 2 },
  { id: 'status-done', name: 'Done', category: 'done', position: 3 },
];

const DEFAULT_TYPES = TASK_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));

const PRIORITY_FILTERS: Array<{ label: string; value: number | null }> = [
  { label: 'All', value: null },
  { label: 'Urgent', value: 4 },
  { label: 'High', value: 3 },
  { label: 'Medium', value: 2 },
  { label: 'Low', value: 1 },
];

/** Content signature: a parent list is adopted only when it really differs. */
const signatureOf = (items: WorkItemData[]) =>
  items
    .map((i) => [i.id, i.status_id, i.title, i.priority, i.due_date, i.type_id, i.sequence, i.updated_at].join(':'))
    .join('|');

interface BoardPayload {
  items?: WorkItemData[];
  statuses?: StatusColumn[];
  types?: Array<{ id: string; name: string }>;
}

async function fetchBoard(projectId: string, signal?: AbortSignal): Promise<BoardPayload> {
  const res = await fetch(`/api/work-items?projectId=${encodeURIComponent(projectId)}`, { signal });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/** Column an item belongs in; unknown status ids resolve by category. */
function columnFor(item: WorkItemData, statuses: StatusColumn[]): string | undefined {
  if (statuses.some((s) => s.id === item.status_id)) return item.status_id;
  const id = (item.status_id ?? '').toLowerCase();
  const byCategory =
    statuses.find((s) => item.status_category && s.category === item.status_category) ??
    statuses.find((s) => id.includes(String(s.category)) || id.endsWith(s.name.toLowerCase().replace(/\s+/g, '-')));
  return (byCategory ?? statuses[0])?.id;
}

export function KanbanBoard({
  workspaceId,
  projectId,
  projectKey = 'PRJ',
  initialItems = [],
  onItemsChange,
  enableShortcuts = true,
}: KanbanBoardProps) {
  const [items, setItems] = useState<WorkItemData[]>(initialItems);
  const [statuses, setStatuses] = useState<StatusColumn[]>(DEFAULT_STATUSES);
  const [types, setTypes] = useState<Array<{ id: string; name: string }>>(DEFAULT_TYPES);
  const [loaded, setLoaded] = useState(initialItems.length > 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [compact, setCompact] = useState(false);

  const [quickCreate, setQuickCreate] = useState<{ open: boolean; statusId: string | null; key: number }>({
    open: false,
    statusId: null,
    key: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  /** A refused move or a failed load is reported, not swallowed. */
  const [moveError, setMoveError] = useState<string | null>(null);

  // Adopt the parent's list when its content changes (derived state, not an
  // effect, so a parent refresh never overwrites a board edit in flight).
  const initialSignature = signatureOf(initialItems);
  const [adoptedSignature, setAdoptedSignature] = useState(initialSignature);
  if (initialSignature !== adoptedSignature) {
    setAdoptedSignature(initialSignature);
    if (initialItems.length > 0 && signatureOf(items) !== initialSignature) setItems(initialItems);
  }

  // Report board changes upward.
  const onItemsChangeRef = useRef(onItemsChange);
  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
  }, [onItemsChange]);
  const reported = useRef(signatureOf(initialItems));
  useEffect(() => {
    const signature = signatureOf(items);
    if (signature === reported.current) return;
    reported.current = signature;
    onItemsChangeRef.current?.(items);
  }, [items]);

  const applyBoard = useCallback((data: BoardPayload) => {
    setItems(Array.isArray(data.items) ? data.items : []);
    if (Array.isArray(data.statuses) && data.statuses.length > 0) setStatuses(data.statuses);
    if (Array.isArray(data.types) && data.types.length > 0) setTypes(data.types);
    setMoveError(null);
    setLoaded(true);
  }, []);

  const failBoard = useCallback((err: unknown) => {
    if ((err as Error)?.name === 'AbortError') return;
    // A failed load is reported, never shown as an empty board.
    setMoveError('Could not load this board. Check your connection and try again.');
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    fetchBoard(projectId, controller.signal).then(applyBoard, failBoard);
    return () => controller.abort();
  }, [projectId, applyBoard, failBoard]);

  const reload = () => fetchBoard(projectId).then(applyBoard, failBoard);

  const openQuickCreate = useCallback((statusId: string | null) => {
    setQuickCreate((prev) => ({ open: true, statusId, key: prev.key + 1 }));
  }, []);

  // "C" creates a task — but never with a modifier (Ctrl+C is copy), inside a
  // field, or while a dialog is already open.
  useEffect(() => {
    if (!enableShortcuts) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'c' && e.key !== 'C') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      openQuickCreate(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcuts, openQuickCreate]);

  const filtersActive = Boolean(searchQuery.trim() || selectedPriority !== null || selectedCategory);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const key = `${projectKey}-${item.sequence ?? ''}`.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !key.includes(q)) return false;
      }
      if (selectedPriority !== null && (item.priority ?? 0) !== selectedPriority) return false;
      if (selectedCategory && categoryOf(item.type_id, types).id !== selectedCategory) return false;
      return true;
    });
  }, [items, searchQuery, selectedPriority, selectedCategory, projectKey, types]);

  const columns = useMemo(() => {
    const map: Record<string, WorkItemData[]> = Object.fromEntries(statuses.map((s) => [s.id, []]));
    for (const item of filteredItems) {
      const col = columnFor(item, statuses);
      if (col && map[col]) map[col].push(item);
    }
    for (const list of Object.values(map)) list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return map;
  }, [filteredItems, statuses]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const id = categoryOf(item.type_id, types).id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [items, types]);

  /**
   * Moves a card and stays honest about the outcome: the change is shown at
   * once, and put back with a message if the server refuses it.
   */
  const moveItem = async (itemId: string, targetStatusId: string) => {
    const current = items.find((i) => i.id === itemId);
    if (!current) return;
    const previousStatusId = current.status_id;
    const previousCategory = current.status_category ?? null;
    if (columnFor(current, statuses) === targetStatusId) return;

    const target = statuses.find((s) => s.id === targetStatusId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status_id: targetStatusId, status_category: target?.category ?? null }
          : item
      )
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
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status_id: previousStatusId, status_category: previousCategory } : item
        )
      );
      setMoveError('That move could not be saved, so the card was put back.');
    }
  };

  const toggleDone = (item: WorkItemData) => {
    const done = isDone(item);
    const target = done
      ? statuses.find((s) => s.category === 'todo') ?? statuses[0]
      : statuses.find((s) => s.category === 'done') ?? statuses[statuses.length - 1];
    if (target) void moveItem(item.id, target.id);
  };

  const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    setDragOverColumn(null);
    if (itemId) void moveItem(itemId, targetStatusId);
  };

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) ?? null : null;
  const totalVisible = filteredItems.length;

  return (
    <div className={`board ${compact ? 'board--compact' : ''}`}>
      {moveError && (
        <div className="nx-alert nx-alert--error board-error" role="alert">
          <span>{moveError}</span>
          <button type="button" className="nx-alert__action" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      )}

      <div className="board-toolbar">
        <div className="board-toolbar__group">
          <label className="board-search">
            <SearchRoundedIcon sx={{ fontSize: 16 }} />
            <input
              type="search"
              className="nx-input"
              placeholder="Filter by title or key"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter tasks by title or key"
            />
          </label>

          <div className="nx-segmented" role="group" aria-label="Filter by priority">
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p.label}
                type="button"
                aria-pressed={selectedPriority === p.value}
                onClick={() => setSelectedPriority(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <select
            className="nx-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {TASK_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.shortName} ({categoryCounts.get(cat.id) ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div className="board-toolbar__group">
          <button
            type="button"
            className={`nx-icon-btn ${compact ? 'nx-icon-btn--active' : ''}`}
            onClick={() => setCompact((v) => !v)}
            aria-pressed={compact}
            aria-label="Compact cards"
            title="Compact cards"
          >
            <ViewAgendaOutlinedIcon sx={{ fontSize: 17 }} />
          </button>
          <button type="button" className="nx-btn nx-btn--secondary nx-btn--sm" onClick={() => openQuickCreate(null)}>
            <AddRoundedIcon sx={{ fontSize: 16 }} />
            Add task
            {enableShortcuts && <kbd className="nx-kbd">C</kbd>}
          </button>
        </div>
      </div>

      {filtersActive && loaded && totalVisible === 0 && (
        <div className="nx-empty">
          <p className="nx-empty__title">Nothing matches these filters</p>
          <p className="nx-empty__body">
            {items.length} {items.length === 1 ? 'task is' : 'tasks are'} on this board, but none fit the current
            search, priority and category.
          </p>
          <div className="nx-empty__actions">
            <button
              type="button"
              className="nx-btn nx-btn--secondary nx-btn--sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedPriority(null);
                setSelectedCategory('');
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="board-lanes">
        {statuses.map((col, index) => {
          const colItems = columns[col.id] ?? [];
          const tone = statusTone(col);
          return (
            <section
              key={col.id}
              className={`board-lane ${dragOverColumn === col.id ? 'board-lane--over' : ''}`}
              aria-label={`${col.name}, ${colItems.length} ${colItems.length === 1 ? 'task' : 'tasks'}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverColumn !== col.id) setDragOverColumn(col.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOverColumn(null);
              }}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <header className="lane-head">
                <span className={`lane-dot lane-dot--${tone}`} aria-hidden="true" />
                <h3 className="lane-head__name">{col.name}</h3>
                <span className="lane-head__count">{colItems.length}</span>
                <button
                  type="button"
                  className="nx-icon-btn lane-head__add"
                  onClick={() => openQuickCreate(col.id)}
                  aria-label={`Add a task to ${col.name}`}
                  title={`Add to ${col.name}`}
                >
                  <AddRoundedIcon sx={{ fontSize: 16 }} />
                </button>
              </header>

              <div className="lane-cards">
                {!loaded ? (
                  <div className="lane-empty" aria-hidden="true">
                    Loading…
                  </div>
                ) : colItems.length === 0 ? (
                  <div className="lane-empty">
                    {items.length === 0 && index === 0 ? (
                      <button type="button" className="auth-link" onClick={() => openQuickCreate(col.id)}>
                        Add the first task
                      </button>
                    ) : (
                      'Drop tasks here'
                    )}
                  </div>
                ) : (
                  colItems.map((item) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      projectKey={projectKey}
                      category={categoryOf(item.type_id, types)}
                      isDone={isDone({ ...item, status_category: item.status_category ?? col.category })}
                      statusId={col.id}
                      statuses={statuses}
                      dragging={draggedId === item.id}
                      onOpen={() => setSelectedId(item.id)}
                      onToggleDone={() => toggleDone({ ...item, status_category: item.status_category ?? col.category })}
                      onMove={(statusId) => void moveItem(item.id, statusId)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedId(item.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverColumn(null);
                      }}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <QuickCreateModal
        key={quickCreate.key}
        isOpen={quickCreate.open}
        onClose={() => setQuickCreate((prev) => ({ ...prev, open: false }))}
        workspaceId={workspaceId}
        projectId={projectId}
        initialStatusId={quickCreate.statusId || statuses[0]?.id || 'status-todo'}
        availableStatuses={statuses}
        onSuccess={(newItem) => setItems((prev) => [newItem, ...prev])}
        onItemReconciled={(optimisticId, stored) =>
          setItems((prev) => prev.map((it) => (it.id === optimisticId ? stored : it)))
        }
        onCreateFailed={(optimistic, message) => {
          setItems((prev) => prev.filter((it) => it.id !== optimistic.id));
          setMoveError(message);
        }}
      />

      <WorkItemDetailDrawer
        item={selectedItem}
        statuses={statuses}
        types={types}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedId(null)}
        projectKey={projectKey}
        onUpdateItem={(updated) => setItems((prev) => prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)))}
        onDeleteItem={(deletedId) => {
          setItems((prev) => prev.filter((it) => it.id !== deletedId));
          setSelectedId(null);
        }}
      />
    </div>
  );
}
