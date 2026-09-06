'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SPRING_DRAG, SPRING_SNAPPY } from '@/components/ui/motion/spring-presets';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SparklesIcon from '@mui/icons-material/AutoAwesomeRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';

interface SandboxTask {
  id: string;
  key: string;
  title: string;
  column: 'todo' | 'progress' | 'done';
  priority: 'urgent' | 'high' | 'normal';
  tag: string;
  points: number;
}

const INITIAL_TASKS: SandboxTask[] = [
  {
    id: 'sb-1',
    key: 'PROJ-101',
    title: 'Finalize Q3 product launch timeline & team deliverables',
    column: 'todo',
    priority: 'urgent',
    tag: 'Operations',
    points: 8,
  },
  {
    id: 'sb-2',
    key: 'PROJ-102',
    title: 'Design customer onboarding experience for new web app',
    column: 'progress',
    priority: 'high',
    tag: 'Design',
    points: 5,
  },
  {
    id: 'sb-3',
    key: 'PROJ-103',
    title: 'Quarterly financial review & team budget allocation',
    column: 'progress',
    priority: 'normal',
    tag: 'Finance',
    points: 3,
  },
  {
    id: 'sb-4',
    key: 'PROJ-104',
    title: 'Security compliance & data privacy audit sign-off',
    column: 'done',
    priority: 'high',
    tag: 'Legal',
    points: 5,
  },
];

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'var(--aurora-iris)', glow: 'rgba(155, 140, 255, 0.35)' },
  { id: 'progress', label: 'In Progress', color: 'var(--aurora-amber)', glow: 'rgba(241, 184, 106, 0.35)' },
  { id: 'done', label: 'Done', color: 'var(--aurora-jade)', glow: 'rgba(87, 211, 154, 0.35)' },
] as const;

export function HeroLiveSandbox() {
  const [tasks, setTasks] = useState<SandboxTask[]>(INITIAL_TASKS);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  function moveTask(taskId: string, targetCol: 'todo' | 'progress' | 'done') {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetCol } : t))
    );
  }

  function cycleTask(taskId: string) {
    const order: Array<'todo' | 'progress' | 'done'> = ['todo', 'progress', 'done'];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextIdx = (order.indexOf(t.column) + 1) % order.length;
          return { ...t, column: order[nextIdx] };
        }
        return t;
      })
    );
  }

  return (
    <div className="sandbox-card-shell">
      {/* Top Specular Rim Lighting */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Sandbox Header Bar */}
      <div className="sandbox-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sandbox-dots">
            <span className="sandbox-dot sandbox-dot--red" />
            <span className="sandbox-dot sandbox-dot--yellow" />
            <span className="sandbox-dot sandbox-dot--green" />
          </div>
          <span className="sandbox-app-name">
            nexora-workspace-live-preview.app
          </span>

          <div style={{ display: 'flex', gap: 4, background: 'rgba(0, 0, 0, 0.16)', padding: 3, borderRadius: 8, marginLeft: 8 }}>
            <button
              onClick={() => setViewMode('board')}
              style={{
                background: viewMode === 'board' ? 'var(--nx-surface-2)' : 'transparent',
                color: viewMode === 'board' ? 'var(--nx-text)' : 'var(--nx-text-3)',
                boxShadow: viewMode === 'board' ? '0 1px 4px rgba(0, 0, 0, 0.26)' : 'none',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Board View
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--nx-surface-2)' : 'transparent',
                color: viewMode === 'list' ? 'var(--nx-text)' : 'var(--nx-text-3)',
                boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0, 0, 0, 0.26)' : 'none',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              List View
            </button>
          </div>
        </div>

        <div className="sandbox-indicator-pill">
          <TouchAppRoundedIcon sx={{ fontSize: 16 }} />
          <span>Interactive Live Sandbox • Click or Drag to Move Cards</span>
        </div>
      </div>

      {/* Conditional View: 3-Column Kanban Board OR Crisp List View */}
      {viewMode === 'board' ? (
        <div className="sandbox-columns-grid">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.column === col.id);
            const isTarget = activeColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setActiveColumn(col.id);
                }}
                onDragLeave={() => setActiveColumn(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) {
                    moveTask(taskId, col.id);
                  }
                  setActiveColumn(null);
                }}
                className={`sandbox-col-box ${isTarget ? 'sandbox-col-box--dragover' : ''}`}
              >
                {/* Column Header */}
                <div className="sandbox-col-header">
                  <div className="sandbox-col-title-wrap">
                    <span
                      className="sandbox-col-beacon"
                      style={{
                        backgroundColor: col.color,
                        boxShadow: `0 0 10px ${col.glow}`,
                      }}
                    />
                    <span>{col.label}</span>
                  </div>
                  <span
                    className="sandbox-col-badge"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${col.color} 20%, transparent)`,
                      color: col.color,
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Tasks */}
                <div className="sandbox-task-list">
                  <AnimatePresence mode="popLayout">
                    {colTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        layoutId={task.id}
                        transition={SPRING_DRAG}
                        draggable
                        onDragStart={(e) => {
                          (e as any).dataTransfer.setData('text/plain', task.id);
                        }}
                        onClick={() => cycleTask(task.id)}
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="sandbox-task-card"
                      >
                        <div className="sandbox-task-header">
                          <span className="sandbox-task-key">
                            {task.key}
                          </span>
                          <span
                            className="sandbox-priority-pill"
                            style={{
                              backgroundColor:
                                task.priority === 'urgent'
                                  ? 'rgba(255, 113, 133, 0.2)'
                                  : task.priority === 'high'
                                  ? 'rgba(241, 184, 106, 0.2)'
                                  : 'rgba(70, 215, 232, 0.2)',
                              color:
                                task.priority === 'urgent'
                                  ? 'var(--aurora-rose)'
                                  : task.priority === 'high'
                                  ? 'var(--aurora-amber)'
                                  : 'var(--aurora-aqua)',
                              border: '1px solid currentColor',
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="sandbox-task-title">
                          {task.title}
                        </div>

                        <div className="sandbox-task-footer">
                          <span className="sandbox-tag-pill">
                            {task.tag}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--aurora-aqua)',
                            }}
                          >
                            <SparklesIcon sx={{ fontSize: 13 }} />
                            {task.points} pts
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {colTasks.length === 0 && (
                    <div className="sandbox-empty-drop">
                      Drop items here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px', minHeight: 280 }}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              onClick={() => cycleTask(task.id)}
              whileHover={{ scale: 1.01, backgroundColor: 'var(--nx-surface-2)' }}
              whileTap={{ scale: 0.99 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--nx-surface)',
                borderRadius: 12,
                border: '1px solid var(--nx-border)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.13)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aurora-iris)' }}>
                  {task.key}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--nx-text)' }}>
                  {task.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: 9999,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  background: task.column === 'done' ? 'rgba(87, 211, 154, 0.15)' : task.column === 'progress' ? 'rgba(241, 184, 106, 0.15)' : 'rgba(155, 140, 255, 0.15)',
                  color: task.column === 'done' ? 'var(--nx-green)' : task.column === 'progress' ? 'var(--nx-amber)' : 'var(--nx-violet)',
                }}>
                  {task.column === 'done' ? 'Done' : task.column === 'progress' ? 'In Progress' : 'To Do'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--nx-text-3)' }}>{task.tag}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Sandbox Footer Bar */}
      <div className="sandbox-bottom-bar">
        <div className="sandbox-hotkey-hint">
          <KeyboardRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-amber)' }} />
          <span>Press ⌘K for Command Palette anytime</span>
        </div>
        <div className="sandbox-trust-pills">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--aurora-jade)' }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
            Instant multi-user sync
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--aurora-aqua)' }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
            Bank-grade data security
          </span>
        </div>
      </div>
    </div>
  );
}
