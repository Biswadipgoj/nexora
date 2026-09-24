'use client';

import React, { useState } from 'react';
import { PriorityMark, CategoryMark, Avatar } from '@/components/ui/Marks';
import { getCategoryByIdOrName } from '@/lib/constants/categories';
import '@/components/board/board.css';

type Column = 'todo' | 'progress' | 'done';

interface SandboxTask {
  id: string;
  key: string;
  title: string;
  column: Column;
  priority: number;
  category: string;
  owner: string;
  due: string;
}

const INITIAL_TASKS: SandboxTask[] = [
  { id: 's1', key: 'APP-101', title: 'Biometric sign-in on Android', column: 'todo', priority: 3, category: 'type-security', owner: 'Alex Morgan', due: 'Sep 18' },
  { id: 's2', key: 'APP-102', title: 'Deep links from push notifications', column: 'todo', priority: 2, category: 'type-backend', owner: 'Sarah Chen', due: 'Sep 15' },
  { id: 's3', key: 'APP-104', title: 'Stripe checkout integration', column: 'progress', priority: 3, category: 'type-feature', owner: 'Alex Morgan', due: 'Friday' },
  { id: 's4', key: 'APP-98', title: 'Profile photo upload and cropping', column: 'progress', priority: 2, category: 'type-ui', owner: 'Sarah Chen', due: 'Sep 8' },
  { id: 's5', key: 'APP-91', title: 'Fix the login loop on an expired token', column: 'done', priority: 4, category: 'type-bug', owner: 'Alex Morgan', due: 'Sep 4' },
];

const COLUMNS: Array<{ id: Column; label: string; tone: 'todo' | 'progress' | 'done' }> = [
  { id: 'todo', label: 'To Do', tone: 'todo' },
  { id: 'progress', label: 'In Progress', tone: 'progress' },
  { id: 'done', label: 'Done', tone: 'done' },
];

const NEXT: Record<Column, Column> = { todo: 'progress', progress: 'done', done: 'todo' };

/**
 * A working miniature of the board, built from the same card styles as the
 * app. Nothing here is saved; it exists so a visitor can feel how moving work
 * behaves before signing up.
 */
export function HeroLiveSandbox() {
  const [tasks, setTasks] = useState<SandboxTask[]>(INITIAL_TASKS);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [over, setOver] = useState<Column | null>(null);

  const move = (id: string, column: Column) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)));

  const card = (task: SandboxTask) => {
    const done = task.column === 'done';
    return (
      <div
        key={task.id}
        className={`wi-card ${done ? 'wi-card--done' : ''}`}
        role="button"
        tabIndex={0}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
        onClick={() => move(task.id, NEXT[task.column])}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            move(task.id, NEXT[task.column]);
          }
        }}
        aria-label={`${task.key}: ${task.title}. Press Enter to move it along.`}
      >
        <div className="wi-card__top">
          <span className={`wi-card__check ${done ? 'wi-card__check--done' : ''}`} aria-hidden="true">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2.5 6.5l2.5 2.5 4.5-6" />
            </svg>
          </span>
          <span className="nx-key">{task.key}</span>
          <PriorityMark priority={task.priority} showLabel={task.priority >= 3} />
        </div>
        <p className="wi-card__title">{task.title}</p>
        <div className="wi-card__meta">
          <CategoryMark category={getCategoryByIdOrName(task.category)} />
          {!done && <span>Due {task.due}</span>}
          <span style={{ marginLeft: 'auto' }}>
            <Avatar name={task.owner} />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="sandbox">
      <div className="sandbox__bar">
        <span className="sandbox__title">
          Mobile App <span className="nx-key">APP</span>
        </span>
        <div className="nx-segmented" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}>
            Board
          </button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            List
          </button>
        </div>
        <span className="sandbox__hint">Try it: drag a card, or click one to move it along.</span>
      </div>

      {view === 'board' ? (
        <div className="sandbox__lanes">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.column === col.id);
            return (
              <section
                key={col.id}
                className={`sandbox__lane ${over === col.id ? 'sandbox__lane--over' : ''}`}
                aria-label={`${col.label}, ${colTasks.length} tasks`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (over !== col.id) setOver(col.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) move(id, col.id);
                  setOver(null);
                }}
              >
                <header className="lane-head">
                  <span className={`lane-dot lane-dot--${col.tone}`} aria-hidden="true" />
                  <h3 className="lane-head__name">{col.label}</h3>
                  <span className="lane-head__count">{colTasks.length}</span>
                </header>
                <div className="lane-cards">
                  {colTasks.length === 0 ? <div className="lane-empty">Drop a card here</div> : colTasks.map(card)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="sandbox__list">
          {tasks.map((task) => (
            <button key={task.id} type="button" className="sandbox__row" onClick={() => move(task.id, NEXT[task.column])}>
              <span className="nx-key">{task.key}</span>
              <span className="sandbox__row-title">{task.title}</span>
              <PriorityMark priority={task.priority} showLabel={false} />
              <span className={`nx-chip ${task.column === 'done' ? 'nx-chip--green' : task.column === 'progress' ? 'nx-chip--amber' : ''}`}>
                {COLUMNS.find((c) => c.id === task.column)?.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="sandbox__foot">
        <kbd className="nx-kbd">Ctrl K</kbd> opens search and commands anywhere in the app. Changes here are not saved.
      </div>
    </div>
  );
}
