'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Tooltip from '@mui/material/Tooltip';
import { getCategoryByIdOrName } from '@/lib/constants/categories';
import type { WorkItemData } from '@/components/board/KanbanBoard';
import {
  countFocus,
  filterItems,
  sortForFocus,
  formatDueLabel,
  bucketOf,
  FILTER_LABELS,
  type FocusFilter,
} from '@/lib/work/focus';

const PRIORITY_META: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'None', color: 'var(--nx-text-3)', bg: 'rgba(100, 116, 139, 0.12)' },
  1: { label: 'Low', color: 'var(--nx-cyan)', bg: 'rgba(70, 215, 232, 0.12)' },
  2: { label: 'Medium', color: 'var(--nx-amber)', bg: 'rgba(241, 184, 106, 0.12)' },
  3: { label: 'High', color: 'var(--nx-amber)', bg: 'rgba(234, 88, 12, 0.12)' },
  4: { label: 'Urgent', color: 'var(--nx-red)', bg: 'rgba(255, 113, 133, 0.12)' },
};

interface TasksTabProps {
  workItems: WorkItemData[];
  currentUserName?: string;
  /** Owned by the dashboard so a metric click carries its filter here (5.2). */
  filter: FocusFilter;
  onFilterChange: (filter: FocusFilter) => void;
  onOpenItem: (item: WorkItemData) => void;
  onToggleStatus: (id: string, currentStatusId: string) => void;
  onQuickCreate: () => void;
}

const FILTER_ORDER: FocusFilter[] = ['all', 'overdue', 'due-today', 'in-progress', 'completed'];

export function TasksTab({
  workItems,
  currentUserName,
  filter,
  onFilterChange,
  onOpenItem,
  onToggleStatus,
  onQuickCreate,
}: TasksTabProps) {
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  const userMatchedTasks = workItems.filter((w) => {
    if (!currentUserName) return true;
    if (w.assignees && w.assignees.length > 0) {
      return w.assignees.some((a: any) => a?.name?.toLowerCase() === currentUserName.toLowerCase());
    }
    return false;
  });

  // If the user has assigned tasks, show those; otherwise fall back to the whole
  // workspace so a new account does not open onto a blank screen.
  const myTasks = userMatchedTasks.length > 0 ? userMatchedTasks : workItems;

  const counts = useMemo(() => countFocus(myTasks), [myTasks]);

  // Section 5.4: "The default sort is overdue, due today, due soon, then
  // unscheduled." Shared with the dashboard so both surfaces agree.
  const filteredTasks = useMemo(
    () => sortForFocus(filterItems(myTasks, filter)),
    [myTasks, filter]
  );

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

  const completedCount = counts.completed;

  return (
    <div className="tab-content">
      {/* Header Card */}
      <div className="tab-header-card">
        <div className="tab-header-title-wrap">
          <div className="tab-header-title">
            <AssignmentTurnedInRoundedIcon sx={{ fontSize: 24, color: 'var(--aurora-jade)' }} />
            <span>My Tasks</span>
            <span className="nav-badge-pill" style={{ background: 'var(--nx-blue)', fontSize: '0.75rem' }}>
              {myTasks.length - completedCount} pending
            </span>
          </div>
          <p className="tab-header-desc">
            Sorted by what needs you first: overdue, then due today, then everything else.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Completed: {completedCount} / {myTasks.length}
          </span>
        </div>
      </div>

      {/* Filter bar. The same FocusFilter set the dashboard strip uses, so a
          metric click lands here with its filter already applied (section 5.2)
          and the counts match the number that was clicked. */}
      <div className="tab-filter-bar">
        <div className="tab-filter-group" role="group" aria-label="Filter tasks">
          {FILTER_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              className={`tab-filter-pill ${filter === f ? 'tab-filter-pill--active' : ''}`}
              onClick={() => onFilterChange(f)}
            >
              {FILTER_LABELS[f]} ({countFor(f)})
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, idx) => {
            const isDone = task.status_id === 'status-done';
            const prioKey = task.priority !== undefined && task.priority in PRIORITY_META ? task.priority : 0;
            const prio = PRIORITY_META[prioKey];
            // No fabricated project prefix. This rendered "APP-" for every task
            // regardless of its project, and fell back to an index-derived
            // number, so the same item showed a different key here than on the
            // board — it read as two separate tasks (section 3.5).
            const sequenceKey = task.sequence ? `#${task.sequence}` : '';
            const category = getCategoryByIdOrName(task.type_id);

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`task-row-card ${isDone ? 'task-row-card--done' : ''}`}
                onClick={() => onOpenItem(task)}
                /* Section 9 — rows were plain divs, so keyboard users could not
                   open a task and never received the global focus ring. */
                role="button"
                tabIndex={0}
                aria-label={`Open ${task.title}`}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenItem(task);
                  }
                }}
              >
                <div className="task-row-left">
                  <button
                    className={`task-checkbox-btn ${isDone ? 'task-checkbox-btn--done' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(task.id, task.status_id || 'status-todo');
                    }}
                    title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {isDone ? (
                      <CheckCircleRoundedIcon sx={{ fontSize: 22 }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 22 }} />
                    )}
                  </button>

                  <span className="task-row-key">{sequenceKey}</span>

                  <span
                    className="task-row-category"
                    style={{
                      color: category.color,
                      backgroundColor: category.bgColor,
                      border: `1px solid ${category.borderColor}`,
                    }}
                    title={`${category.name}: ${category.description}`}
                  >
                    <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>{category.icon}</span>
                    <span>{category.shortName}</span>
                  </span>

                  <span className={`task-row-title ${isDone ? 'task-row-title--done' : ''}`}>
                    {task.title}
                  </span>
                </div>

                <div className="task-row-right">
                  <span
                    className="task-priority-tag"
                    style={{
                      color: prio.color,
                      backgroundColor: prio.bg,
                      border: `1px solid ${prio.color}30`,
                    }}
                  >
                    <FlagRoundedIcon sx={{ fontSize: 12 }} />
                    {prio.label}
                  </span>

                  {/* A readable relative label, not the raw stored date, and
                      the urgency is carried by the word as well as the colour
                      (section 9). */}
                  {formatDueLabel(task) && (
                    <span className={`task-date-chip task-date-chip--${bucketOf(task)}`}>
                      <AccessTimeRoundedIcon sx={{ fontSize: 13 }} />
                      {formatDueLabel(task)}
                    </span>
                  )}

                  {task.assignees && task.assignees.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {task.assignees.map((a: any, i: number) => (
                        <Tooltip key={i} title={a.name || 'Assignee'}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--nx-blue) 0%, var(--nx-violet) 100%)',
                              color: 'var(--nx-on-accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.39)',
                            }}
                          >
                            {getInitials(a.name || 'User')}
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                  )}

                  <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: 'var(--text-subtle)' }} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Section 5.4: "The empty state should offer Create task, Plan my week,
            and Open a project as explicit next actions." The wording depends on
            which filter emptied the list, so it says what actually happened. */}
        {filteredTasks.length === 0 && (
          <div className="empty-state-box">
            <CheckCircleRoundedIcon sx={{ fontSize: 32, color: 'var(--nx-green)', marginBottom: 1 }} />
            <h4 className="empty-state-box__title">
              {myTasks.length === 0
                ? 'No tasks yet'
                : filter === 'all'
                ? 'Nothing assigned to you'
                : `Nothing ${FILTER_LABELS[filter].toLowerCase()}`}
            </h4>
            <p className="empty-state-box__body">
              {myTasks.length === 0
                ? 'Create your first task and it will appear here and on the board.'
                : filter === 'overdue'
                ? 'Nothing has slipped past its due date.'
                : filter === 'due-today'
                ? 'Nothing is due today. A good moment to pull work forward.'
                : filter === 'completed'
                ? 'Finished work will collect here as you check items off.'
                : 'Nothing matches this filter right now.'}
            </p>
            <div className="empty-state-box__actions">
              <button type="button" className="overview-empty__action" onClick={onQuickCreate}>
                Create task
              </button>
              {filter !== 'all' && (
                <button
                  type="button"
                  className="overview-empty__action"
                  onClick={() => onFilterChange('all')}
                >
                  Show all tasks
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
