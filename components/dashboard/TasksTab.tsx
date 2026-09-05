'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import Tooltip from '@mui/material/Tooltip';
import type { WorkItemData } from '@/components/board/KanbanBoard';

const PRIORITY_META: Record<number, { label: string; color: string }> = {
  0: { label: 'None', color: '#94A3B8' },
  1: { label: 'Low', color: '#3B82F6' },
  2: { label: 'Medium', color: '#EAB308' },
  3: { label: 'High', color: '#F97316' },
  4: { label: 'Urgent', color: '#EF4444' },
};

interface TasksTabProps {
  workItems: WorkItemData[];
  onOpenItem: (item: WorkItemData) => void;
  onToggleStatus: (id: string, currentStatusId: string) => void;
}

export function TasksTab({ workItems, onOpenItem, onToggleStatus }: TasksTabProps) {
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  const myTasks = workItems.filter((w) => {
    if (w.assignees && w.assignees.length > 0) {
      return w.assignees.some((a) => a.name === 'Alex Morgan' || a.name === 'Biswadip Paul');
    }
    return w.assignee?.name === 'Alex Morgan' || w.assignee?.name === 'Biswadip Paul';
  });
  const filteredTasks = myTasks.filter(w => {
    if (filter === 'todo') return w.status_id !== 'status-done';
    if (filter === 'done') return w.status_id === 'status-done';
    return true;
  });

  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className="tab-content"
    >
      <div className="material-hero-banner">
        <div className="hero-bg-gradient gradient-3" />
        <div className="material-hero-overlay">
          <div>
            <div className="hero-kicker">Focus Mode</div>
            <h2 className="hero-heading">My Tasks</h2>
            <p className="hero-copy">Manage your assigned work items. Strike through completed tasks for instant tactile feedback.</p>
          </div>
        </div>
      </div>

      <div className="material-filter-bar">
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`material-pill-tab ${filter === 'all' ? 'material-pill-tab--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Assigned ({myTasks.length})
          </button>
          <button
            className={`material-pill-tab ${filter === 'todo' ? 'material-pill-tab--active' : ''}`}
            onClick={() => setFilter('todo')}
          >
            To Do
          </button>
          <button
            className={`material-pill-tab ${filter === 'done' ? 'material-pill-tab--active' : ''}`}
            onClick={() => setFilter('done')}
          >
            Completed
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
            No tasks match your filter. Time to celebrate! 🎉
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status_id === 'status-done';
            const prio = PRIORITY_META[task.priority] || PRIORITY_META[0];
            return (
              <motion.div
                layout
                key={task.id}
                className="material-task-row"
                style={{ opacity: isDone ? 0.6 : 1 }}
                onClick={() => onOpenItem(task)}
              >
                <span
                  style={{
                    color: isDone ? '#10B981' : '#CBD5E1',
                    display: 'flex',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(task.id, task.status_id);
                  }}
                >
                  {isDone ? <CheckCircleRoundedIcon /> : <RadioButtonUncheckedRoundedIcon />}
                </span>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span className={`task-title-text ${isDone ? 'task-title-text--done' : ''}`}>
                    {task.title}
                  </span>
                </div>

                {task.epic_name && (
                  <span
                    className="material-epic-chip"
                    style={{
                      color: task.epic_color || '#8B5CF6',
                      borderColor: `${task.epic_color || '#8B5CF6'}40`,
                      backgroundColor: `${task.epic_color || '#8B5CF6'}15`,
                    }}
                  >
                    <BoltRoundedIcon sx={{ fontSize: 13 }} />
                    {task.epic_name}
                  </span>
                )}

                {task.story_points && (
                  <span className="material-points-pill">{task.story_points} pts</span>
                )}

                <span className="material-priority-chip" style={{ color: prio.color }}>
                  <FlagRoundedIcon sx={{ fontSize: 13 }} />
                  {prio.label}
                </span>

                {task.due_date && (
                  <span className="material-date-chip">
                    <AccessTimeRoundedIcon sx={{ fontSize: 13 }} />
                    {task.due_date}
                  </span>
                )}
                
                {((task.assignees && task.assignees.length > 0) || task.assignee) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {(task.assignees && task.assignees.length > 0 ? task.assignees : [task.assignee!]).map((a, i) => (
                      <Tooltip key={i} title={a.name}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                        }}>
                          {getInitials(a.name)}
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                )}

                <span className="material-row-arrow">→</span>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
