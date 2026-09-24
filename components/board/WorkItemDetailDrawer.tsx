'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { TASK_CATEGORIES } from '@/lib/constants/categories';
import { categoryOf, itemKey, PRIORITY_LABELS, PRIORITY_OPTIONS } from '@/lib/work/display';
import { descriptionText, type WorkItemData } from '@/lib/work/types';
import { Avatar, CategoryMark } from '@/components/ui/Marks';
import './board.css';

export interface WorkItemDetailDrawerProps {
  item: WorkItemData | null;
  isOpen: boolean;
  onClose: () => void;
  projectKey?: string;
  statuses?: Array<{ id: string; name: string; category?: string }>;
  types?: Array<{ id: string; name: string }>;
  onUpdateItem?: (updatedItem: WorkItemData) => void;
  onDeleteItem?: (deletedItemId: string) => void;
}

const DEFAULT_STATUSES = [
  { id: 'status-todo', name: 'To Do', category: 'todo' },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress' },
  { id: 'status-done', name: 'Done', category: 'done' },
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function WorkItemDetailDrawer({
  item,
  isOpen,
  onClose,
  projectKey = 'PRJ',
  statuses = DEFAULT_STATUSES,
  types = [],
  onUpdateItem,
  onDeleteItem,
}: WorkItemDetailDrawerProps) {
  // Pending debounced text is written before the drawer closes, so a quick
  // Escape after typing never loses the edit.
  const flushRef = useRef<() => void>(() => {});
  const registerFlush = useCallback((fn: () => void) => {
    flushRef.current = fn;
  }, []);

  const close = () => {
    flushRef.current();
    onClose();
  };

  return (
    <Drawer anchor="right" open={isOpen && Boolean(item)} onClose={close}>
      {item && (
        <DrawerContent
          key={item.id}
          item={item}
          projectKey={projectKey}
          statuses={statuses}
          types={types}
          onClose={close}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          registerFlush={registerFlush}
        />
      )}
    </Drawer>
  );
}

function DrawerContent({
  item,
  projectKey,
  statuses,
  types,
  onClose,
  onUpdateItem,
  onDeleteItem,
  registerFlush,
}: {
  item: WorkItemData;
  projectKey: string;
  statuses: Array<{ id: string; name: string; category?: string }>;
  types: Array<{ id: string; name: string }>;
  onClose: () => void;
  onUpdateItem?: (updatedItem: WorkItemData) => void;
  onDeleteItem?: (deletedItemId: string) => void;
  registerFlush: (fn: () => void) => void;
}) {
  const initialCategory = categoryOf(item.type_id, types);
  const [title, setTitle] = useState(item.title || '');
  const [statusId, setStatusId] = useState(item.status_id || statuses[0]?.id || 'status-todo');
  const [categoryId, setCategoryId] = useState(initialCategory.id);
  const [priority, setPriority] = useState(item.priority ?? 0);
  const [dueDate, setDueDate] = useState(item.due_date || '');
  const [description, setDescription] = useState(descriptionText(item.description));

  /**
   * Checklist and notes are scratch space on this device. There is no
   * subtasks table and no comments endpoint, so the panel says so rather than
   * implying either was saved.
   */
  const [checklist, setChecklist] = useState<Array<{ id: string; title: string; done: boolean }>>([]);
  const [newCheck, setNewCheck] = useState('');
  const [notes, setNotes] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [newNote, setNewNote] = useState('');

  /** Saving, saved and error are all visible states. */
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<Partial<WorkItemData>>({});
  /**
   * The latest version of the item, including every change made here. Each
   * update used to spread the original `item` prop, so a second edit resent
   * the first field's old value and reverted it in the parent list.
   */
  const latest = useRef<WorkItemData>(item);

  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = setTimeout(() => setSaveState('idle'), 1800);
    return () => clearTimeout(timer);
  }, [saveState]);

  const handleUpdate = async (updates: Partial<WorkItemData>) => {
    latest.current = { ...latest.current, ...updates };
    onUpdateItem?.(latest.current);

    // The placeholder of a task that is still being created has no row yet.
    if (item.id.startsWith('wi-')) return;

    setSaveState('saving');
    try {
      const { status_category: _category, ...body } = updates;
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error ?? 'Could not save that change.');

      setSaveState('saved');
      setSaveError(null);
    } catch (err) {
      setSaveState('error');
      setSaveError(err instanceof Error ? err.message : 'Could not save that change.');
    }
  };

  /** Text edits settle for a moment before saving; blur or close saves at once. */
  const flushSave = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const updates = pendingSave.current;
    pendingSave.current = {};
    if (Object.keys(updates).length > 0) void handleUpdate(updates);
  };

  const queueSave = (updates: Partial<WorkItemData>) => {
    pendingSave.current = { ...pendingSave.current, ...updates };
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 600);
  };

  const flushRef = useRef(flushSave);
  useEffect(() => {
    flushRef.current = flushSave;
  });
  useEffect(() => {
    registerFlush(() => flushRef.current());
    return () => registerFlush(() => {});
  }, [registerFlush]);

  const handleDelete = async () => {
    setConfirmingDelete(false);
    setSaveState('saving');
    try {
      const res = await fetch(`/api/work-items/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(String(res.status));
      onDeleteItem?.(item.id);
      onClose();
    } catch {
      setSaveState('error');
      setSaveError('Could not delete this task. It is still on the board.');
    }
  };

  const doneCount = checklist.filter((c) => c.done).length;
  const assignees = item.assignees ?? [];
  const activeCategory = TASK_CATEGORIES.find((c) => c.id === categoryId) ?? initialCategory;

  return (
    <div className="wi-drawer" role="document">
      <div className="wi-drawer__bar">
        <span className="nx-key wi-drawer__key">{itemKey(projectKey, item.sequence)}</span>
        <CategoryMark category={activeCategory} />
        <span
          className={`wi-drawer__save wi-drawer__save--${saveState}`}
          aria-live="polite"
        >
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'Saved'}
          {saveState === 'error' && 'Not saved'}
        </span>
        <button
          type="button"
          className="nx-icon-btn nx-icon-btn--danger"
          onClick={() => setConfirmingDelete(true)}
          aria-label="Delete task"
          title="Delete task"
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
        </button>
        <button type="button" className="nx-icon-btn" onClick={onClose} aria-label="Close task" title="Close">
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      {confirmingDelete && (
        <div className="wi-confirm" role="alertdialog" aria-label="Confirm delete">
          <p className="wi-confirm__title">Delete this task?</p>
          <p className="wi-confirm__body">
            <strong>{title || 'Untitled task'}</strong> will be removed from the board.
          </p>
          <div className="wi-confirm__actions">
            <button type="button" className="nx-btn nx-btn--danger nx-btn--sm" onClick={handleDelete}>
              Delete task
            </button>
            <button type="button" className="nx-btn nx-btn--ghost nx-btn--sm" onClick={() => setConfirmingDelete(false)}>
              Keep it
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className="nx-alert nx-alert--error wi-drawer__alert" role="alert">
          <span>{saveError}</span>
        </div>
      )}

      <div className="wi-drawer__body">
        <label htmlFor="wi-title" className="nx-visually-hidden">
          Title
        </label>
        <textarea
          id="wi-title"
          className="wi-drawer__title"
          value={title}
          rows={1}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) queueSave({ title: e.target.value.trim() });
          }}
          onBlur={flushSave}
          placeholder="Task title"
        />

        <dl className="wi-props">
          <dt>
            <label htmlFor="wi-status">Status</label>
          </dt>
          <dd>
            <select
              id="wi-status"
              className="nx-select"
              value={statusId}
              onChange={(e) => {
                const next = statuses.find((s) => s.id === e.target.value);
                setStatusId(e.target.value);
                void handleUpdate({ status_id: e.target.value, status_category: next?.category ?? null });
              }}
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </dd>

          <dt>
            <label htmlFor="wi-priority">Priority</label>
          </dt>
          <dd>
            <select
              id="wi-priority"
              className="nx-select"
              value={priority}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value, 10);
                setPriority(value);
                void handleUpdate({ priority: value });
              }}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </dd>

          <dt>
            <label htmlFor="wi-category">Category</label>
          </dt>
          <dd>
            <select
              id="wi-category"
              className="nx-select"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                void handleUpdate({ type_id: e.target.value });
              }}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </dd>

          <dt>
            <label htmlFor="wi-due">Due date</label>
          </dt>
          <dd>
            <input
              id="wi-due"
              type="date"
              className="nx-input"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                void handleUpdate({ due_date: e.target.value || null });
              }}
            />
          </dd>

          {assignees.length > 0 && (
            <>
              <dt>Assignees</dt>
              <dd style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '4px 12px' }}>
                {assignees.map((a, i) => (
                  <span key={`${a.name}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={a.name} />
                    <span style={{ fontSize: 'var(--nx-fs-sm)' }}>{a.name}</span>
                  </span>
                ))}
              </dd>
            </>
          )}
        </dl>

        <section className="wi-section" aria-labelledby="wi-desc-label">
          <div className="wi-section__head">
            <label id="wi-desc-label" htmlFor="wi-desc" className="wi-section__title">
              Description
            </label>
          </div>
          <textarea
            id="wi-desc"
            className="nx-textarea"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              queueSave({ description: e.target.value });
            }}
            onBlur={flushSave}
            placeholder="Context, links, acceptance criteria…"
            rows={5}
          />
        </section>

        <section className="wi-section" aria-labelledby="wi-check-label">
          <div className="wi-section__head">
            <h3 id="wi-check-label" className="wi-section__title">
              Checklist
            </h3>
            {checklist.length > 0 && (
              <span className="wi-section__meta nx-num">
                {doneCount} of {checklist.length}
              </span>
            )}
          </div>
          {checklist.length > 0 && (
            <div className="wi-checklist">
              {checklist.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`wi-check-row ${c.done ? 'wi-check-row--done' : ''}`}
                  aria-pressed={c.done}
                  onClick={() => setChecklist((prev) => prev.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))}
                >
                  <span className={`wi-card__check ${c.done ? 'wi-card__check--done' : ''}`} aria-hidden="true">
                    <CheckRoundedIcon sx={{ fontSize: 10 }} />
                  </span>
                  <span>{c.title}</span>
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCheck.trim()) return;
              setChecklist((prev) => [...prev, { id: `c-${Date.now()}`, title: newCheck.trim(), done: false }]);
              setNewCheck('');
            }}
          >
            <label htmlFor="wi-new-check" className="nx-visually-hidden">
              Add a checklist item
            </label>
            <input
              id="wi-new-check"
              className="nx-input wi-inline-input"
              placeholder="Add an item and press Enter"
              value={newCheck}
              onChange={(e) => setNewCheck(e.target.value)}
            />
          </form>
        </section>

        <section className="wi-section" aria-labelledby="wi-notes-label">
          <div className="wi-section__head">
            <h3 id="wi-notes-label" className="wi-section__title">
              Notes
            </h3>
          </div>
          <p className="wi-note">Notes here stay on this device and are not saved yet.</p>
          {notes.length > 0 && (
            <div className="wi-comments">
              {notes.map((n) => (
                <div key={n.id} className="wi-comment">
                  <Avatar name="You" />
                  <div>
                    <div className="wi-comment__head">
                      <span className="wi-comment__author">You</span>
                      <span className="wi-comment__time">{n.time}</span>
                    </div>
                    <p className="wi-comment__text">{n.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form
            className="wi-comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newNote.trim()) return;
              setNotes((prev) => [...prev, { id: `n-${Date.now()}`, text: newNote.trim(), time: 'just now' }]);
              setNewNote('');
            }}
          >
            <label htmlFor="wi-new-note" className="nx-visually-hidden">
              Write a note
            </label>
            <input
              id="wi-new-note"
              className="nx-input"
              placeholder="Write a note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button type="submit" className="nx-btn nx-btn--secondary" disabled={!newNote.trim()}>
              Add
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
