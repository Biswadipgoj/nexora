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
    key: 'NEX-101',
    title: 'Ship 120fps hardware-accelerated motion engine',
    column: 'todo',
    priority: 'urgent',
    tag: 'Motion',
    points: 8,
  },
  {
    id: 'sb-2',
    key: 'NEX-102',
    title: 'Prismatic Aurora glassmorphism tokens & specular rims',
    column: 'progress',
    priority: 'high',
    tag: 'Design',
    points: 5,
  },
  {
    id: 'sb-3',
    key: 'NEX-103',
    title: 'Zero-lag optimistic client state sync with Supabase RLS',
    column: 'progress',
    priority: 'normal',
    tag: 'Core',
    points: 3,
  },
  {
    id: 'sb-4',
    key: 'NEX-104',
    title: 'Unified cross-platform Android Capacitor & Windows Electron wrapper',
    column: 'done',
    priority: 'high',
    tag: 'Platform',
    points: 5,
  },
];

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'var(--aurora-iris)', glow: 'rgba(139, 92, 246, 0.35)' },
  { id: 'progress', label: 'In Progress', color: 'var(--aurora-amber)', glow: 'rgba(245, 158, 11, 0.35)' },
  { id: 'done', label: 'Done', color: 'var(--aurora-jade)', glow: 'rgba(16, 185, 129, 0.35)' },
] as const;

export function HeroLiveSandbox() {
  const [tasks, setTasks] = useState<SandboxTask[]>(INITIAL_TASKS);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

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
    <div className="relative mx-auto mt-8 w-full max-w-5xl rounded-3xl border border-white/20 bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-lg)] backdrop-blur-3xl sm:p-7">
      {/* Top Specular Rim Lighting */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Sandbox Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="h-3 w-3 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="h-3 w-3 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
            nexora-workspace-live-preview.app
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-semibold text-[var(--aurora-aqua)] shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <TouchAppRoundedIcon sx={{ fontSize: 16 }} />
          <span>Interactive Live Sandbox • Click or Drag to Move Cards</span>
        </div>
      </div>

      {/* 3-Column Interactive Kanban Board */}
      <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
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
              className={`flex flex-col rounded-2xl border p-4 transition-all duration-300 ${
                isTarget
                  ? 'border-white/40 bg-white/10 shadow-[0_0_30px_rgba(139,92,246,0.35)] scale-[1.01]'
                  : 'border-white/10 bg-[var(--surface-elevated)]/60 shadow-[var(--shadow-sm)]'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: col.color,
                      boxShadow: `0 0 10px ${col.glow}`,
                    }}
                  />
                  <span className="text-sm font-semibold text-[var(--text-main)]">
                    {col.label}
                  </span>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-mono font-bold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${col.color} 20%, transparent)`,
                    color: col.color,
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Column Tasks */}
              <div className="flex flex-col gap-3 min-h-[160px]">
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
                      className="group cursor-pointer select-none rounded-xl border border-white/15 bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] backdrop-blur-xl transition-all hover:border-white/30 hover:shadow-[var(--shadow-md)]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-[var(--aurora-iris)]">
                          {task.key}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor:
                              task.priority === 'urgent'
                                ? 'rgba(244, 63, 94, 0.2)'
                                : task.priority === 'high'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(6, 182, 212, 0.2)',
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

                      <p className="text-sm font-medium text-[var(--text-main)] group-hover:text-white line-clamp-2">
                        {task.title}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="rounded-md bg-white/5 px-2 py-0.5 font-medium">
                          {task.tag}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-subtle)] group-hover:text-[var(--aurora-aqua)] transition-colors">
                          <SparklesIcon sx={{ fontSize: 13 }} />
                          {task.points} pts
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 py-8 text-xs text-[var(--text-subtle)]">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sandbox Footer Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <KeyboardRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-amber)' }} />
          <span>Press ⌘K for Command Palette anytime</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[var(--aurora-jade)]">
            <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
            Zero-lag optimistic sync
          </span>
          <span className="flex items-center gap-1.5 text-[var(--aurora-aqua)]">
            <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
            100% RLS Protected
          </span>
        </div>
      </div>
    </div>
  );
}
