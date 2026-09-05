'use client';

import React, { useState } from 'react';
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

const PRIORITY_META: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'None', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  1: { label: 'Low', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
  2: { label: 'Medium', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  3: { label: 'High', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)' },
  4: { label: 'Urgent', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
};

interface TasksTabProps {
  workItems: WorkItemData[];
  currentUserName?: string;
  onOpenItem: (item: WorkItemData) => void;
  onToggleStatus: (id: string, currentStatusId: string) => void;
}

export function TasksTab({ workItems, currentUserName, onOpenItem, onToggleStatus }: TasksTabProps) {
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

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

  // If user has specific assigned tasks, use them; otherwise show all tasks so it's not an empty screen
  const myTasks = userMatchedTasks.length > 0 ? userMatchedTasks : workItems;

  const filteredTasks = myTasks.filter((w) => {
    if (filter === 'todo') return w.status_id !== 'status-done';
    if (filter === 'done') return w.status_id === 'status-done';
    return true;
  });

  const completedCount = myTasks.filter((w) => w.status_id === 'status-done').length;

  return (
    <div className="tab-content">
      {/* Header Card */}
      <div className="tab-header-card">
        <div className="tab-header-title-wrap">
          <div className="tab-header-title">
            <AssignmentTurnedInRoundedIcon sx={{ fontSize: 24, color: 'var(--aurora-jade)' }} />
            <span>My Tasks</span>
            <span className="nav-badge-pill" style={{ background: '#2563eb', fontSize: '0.75rem' }}>
              {myTasks.length - completedCount} pending
            </span>
          </div>
          <p className="tab-header-desc">
            Your personal priority list. Click the checkbox to mark tasks complete with instant tactile sync.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Completed: {completedCount} / {myTasks.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="tab-filter-bar">
        <div className="tab-filter-group">
          <button
            className={`tab-filter-pill ${filter === 'all' ? 'tab-filter-pill--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Assigned ({myTasks.length})
          </button>
          <button
            className={`tab-filter-pill ${filter === 'todo' ? 'tab-filter-pill--active' : ''}`}
            onClick={() => setFilter('todo')}
          >
            To Do ({myTasks.length - completedCount})
          </button>
          <button
            className={`tab-filter-pill ${filter === 'done' ? 'tab-filter-pill--active' : ''}`}
            onClick={() => setFilter('done')}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, idx) => {
            const isDone = task.status_id === 'status-done';
            const prioKey = task.priority !== undefined && task.priority in PRIORITY_META ? task.priority : 0;
            const prio = PRIORITY_META[prioKey];
            const sequenceKey = task.sequence ? `APP-${task.sequence}` : `APP-${100 + idx}`;
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

                  {task.due_date && (
                    <span className="task-date-chip">
                      <AccessTimeRoundedIcon sx={{ fontSize: 13 }} />
                      {task.due_date}
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
                              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              boxShadow: '0 1px 4px rgba(15, 23, 42, 0.15)',
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

        {filteredTasks.length === 0 && (
          <div className="empty-state-box">
            <CheckCircleRoundedIcon sx={{ fontSize: 36, color: 'var(--aurora-jade)', marginBottom: 1 }} />
            <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
              No Tasks Found
            </h4>
            <p style={{ fontSize: '0.875rem' }}>
              {filter === 'done'
                ? 'No completed tasks yet. Check off items as you finish them!'
                : 'You have completed all assigned tasks. Outstanding job!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
