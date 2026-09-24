'use client';

import React, { useMemo } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { countFocus, filterItems, sortForFocus, formatDueLabel, bucketOf, isDone, FILTER_LABELS, type FocusFilter } from '@/lib/work/focus';
import { categoryOf, itemKey } from '@/lib/work/display';
import type { WorkItemData } from '@/lib/work/types';
import { AvatarStack, CategoryMark, PriorityMark } from '@/components/ui/Marks';

interface TasksTabProps {
  workItems: WorkItemData[];
  projects: Array<{ id: string; key: string }>;
  currentUserName?: string;
  /** Owned by the dashboard so a metric click carries its filter here. */
  filter: FocusFilter;
  onFilterChange: (filter: FocusFilter) => void;
  onOpenItem: (item: WorkItemData) => void;
  onToggleStatus: (id: string, currentStatusId: string) => void;
  onQuickCreate: () => void;
}

const FILTER_ORDER: FocusFilter[] = ['all', 'overdue', 'due-today', 'in-progress', 'completed'];

const EMPTY_COPY: Record<FocusFilter, string> = {
  all: 'Create a task and it will appear here and on the board.',
  overdue: 'Nothing has slipped past its due date.',
  'due-today': 'Nothing is due today — a good moment to pull work forward.',
  'in-progress': 'Nothing is being worked on right now.',
  completed: 'Finished work collects here as you check items off.',
};

/**
 * My tasks: what is assigned to you, sorted by what needs you first — overdue,
 * due today, due soon, then everything else. The dashboard figures and this
 * list share one definition of each filter (lib/work/focus).
 */
export function TasksTab({
  workItems,
  projects,
  currentUserName,
  filter,
  onFilterChange,
  onOpenItem,
  onToggleStatus,
  onQuickCreate,
}: TasksTabProps) {
  const assignedToMe = useMemo(() => {
    const me = currentUserName?.toLowerCase();
    if (!me) return [];
    return workItems.filter((w) => (w.assignees ?? []).some((a) => a?.name?.toLowerCase() === me));
  }, [workItems, currentUserName]);

  // A new account has nothing assigned yet; show the whole workspace and say so.
  const showingEverything = assignedToMe.length === 0;
  const myTasks = showingEverything ? workItems : assignedToMe;

  const counts = useMemo(() => countFocus(myTasks), [myTasks]);
  const visible = useMemo(() => sortForFocus(filterItems(myTasks, filter)), [myTasks, filter]);

  const countFor = (f: FocusFilter) =>
    f === 'all'
      ? myTasks.length
      : f === 'overdue'
        ? counts.overdue
        : f === 'due-today'
          ? counts.dueToday
          : f === 'in-progress'
            ? counts.inProgress
            : counts.completed;

  const keyFor = (item: WorkItemData) => {
    const project = projects.find((p) => p.id === item.project_id);
    return itemKey(project?.key ?? 'TASK', item.sequence);
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-head__title">My tasks</h1>
          <p className="page-head__sub">
            {showingEverything
              ? 'Nothing is assigned to you yet, so this shows every task in the workspace.'
              : `${counts.open} open, ${counts.completed} done. Overdue first, then due today.`}
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="nx-btn nx-btn--secondary" onClick={onQuickCreate}>
            New task
          </button>
        </div>
      </header>

      <section>
        <div className="nx-segmented" role="group" aria-label="Filter tasks" style={{ marginBottom: 12 }}>
          {FILTER_ORDER.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => onFilterChange(f)}>
              {FILTER_LABELS[f]} <span className="nx-num">{countFor(f)}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="nx-empty">
            <p className="nx-empty__title">
              {myTasks.length === 0 ? 'No tasks yet' : `Nothing ${FILTER_LABELS[filter].toLowerCase()}`}
            </p>
            <p className="nx-empty__body">{myTasks.length === 0 ? EMPTY_COPY.all : EMPTY_COPY[filter]}</p>
            <div className="nx-empty__actions">
              <button type="button" className="nx-btn nx-btn--secondary nx-btn--sm" onClick={onQuickCreate}>
                Create task
              </button>
              {filter !== 'all' && (
                <button type="button" className="nx-btn nx-btn--ghost nx-btn--sm" onClick={() => onFilterChange('all')}>
                  Show all tasks
                </button>
              )}
            </div>
          </div>
        ) : (
          <ul className="ruled">
            {visible.map((task) => {
              const done = isDone(task);
              const due = formatDueLabel(task);
              const names = (task.assignees ?? []).map((a) => a.name).filter(Boolean);
              return (
                <li key={task.id}>
                  <div
                    className={`task-row ${done ? 'task-row--done' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${task.title}`}
                    onClick={() => onOpenItem(task)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenItem(task);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={`wi-card__check ${done ? 'wi-card__check--done' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(task.id, task.status_id || 'status-todo');
                      }}
                      aria-label={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
                      aria-pressed={done}
                    >
                      <CheckRoundedIcon sx={{ fontSize: 11 }} />
                    </button>
                    <span className="nx-key">{keyFor(task)}</span>
                    <span className="task-row__title">{task.title}</span>
                    <span className="task-row__meta">
                      <CategoryMark category={categoryOf(task.type_id)} />
                      <PriorityMark priority={task.priority} />
                      <span className={`due due--${bucketOf(task)}`}>{done ? 'Done' : due ?? 'No date'}</span>
                      <AvatarStack names={names} max={2} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
