'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme/ThemeProvider';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

type Tab = 'overview' | 'inbox' | 'tasks' | 'projects';

interface PaletteTask {
  id: string;
  title: string;
  sequence?: number;
  priority?: number;
}

interface PaletteProject {
  id: string;
  name: string;
  key: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: Tab) => void;
  onQuickCreate: () => void;
  tasks?: PaletteTask[];
  projects?: PaletteProject[];
  onSelectTask?: (task: PaletteTask) => void;
}

/** Section 5.7 — results are grouped, so the palette reads as an accelerator. */
type Category = 'Tasks' | 'Projects' | 'Go to' | 'Create' | 'Help';

const CATEGORY_ORDER: Category[] = ['Tasks', 'Projects', 'Go to', 'Create', 'Help'];

interface Command {
  id: string;
  category: Category;
  title: string;
  subtitle?: string;
  /** Extra text matched against the query but not displayed. */
  keywords?: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
}

/**
 * Global command palette — Master Design Document, section 5.7.
 *
 * "The command palette is a global accelerator, not a duplicate navigation
 * drawer. It should support navigation, create actions, project switching,
 * theme, and help. Results need categories, keyboard hints, an empty query
 * state, and a no-results state. Esc always closes it; arrow keys and Enter
 * must work without a pointer."
 *
 * Section 9 additionally requires dialogs to trap focus, restore focus to the
 * triggering control, and close with Escape.
 */
export function CommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  onQuickCreate,
  tasks = [],
  projects = [],
  onSelectTask,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const { theme, themeLocked, toggleTheme } = useTheme();

  const go = useCallback(
    (fn: () => void) => () => {
      onClose();
      fn();
    },
    [onClose]
  );

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      {
        id: 'go-overview',
        category: 'Go to',
        title: 'Overview',
        subtitle: 'Board and priorities',
        keywords: 'board kanban home dashboard',
        icon: <DashboardRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-blue)' }} />,
        action: go(() => onNavigateTab('overview')),
      },
      {
        id: 'go-inbox',
        category: 'Go to',
        title: 'Inbox',
        subtitle: 'Updates that need a decision',
        keywords: 'notifications activity',
        icon: <InboxRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-cyan)' }} />,
        action: go(() => onNavigateTab('inbox')),
      },
      {
        id: 'go-tasks',
        category: 'Go to',
        title: 'My Tasks',
        subtitle: 'Assigned to you, by due date',
        keywords: 'mine personal todo',
        icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-green)' }} />,
        action: go(() => onNavigateTab('tasks')),
      },
      {
        id: 'create-task',
        category: 'Create',
        title: 'New task',
        subtitle: 'Add work to a project',
        keywords: 'add issue card',
        hint: 'C',
        icon: <AddCircleOutlineRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-violet)' }} />,
        action: go(onQuickCreate),
      },
      {
        id: 'help-shortcuts',
        category: 'Help',
        title: 'Keyboard shortcuts',
        subtitle: 'Ctrl+K palette, C new task, Esc close',
        keywords: 'keys hotkeys bindings help',
        icon: <KeyboardRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-text-3)' }} />,
        action: go(() => router.push('/dashboard?help=shortcuts')),
      },
    ];

    // Project switching (section 5.7 lists it explicitly).
    for (const project of projects) {
      list.push({
        id: `project-${project.id}`,
        category: 'Projects',
        title: project.name,
        subtitle: project.key,
        keywords: project.key,
        icon: <FolderOpenRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-text-3)' }} />,
        action: go(() => router.push(`/projects/${project.id}`)),
      });
    }

    // The theme command is omitted while light mode is unbuilt (section 2), so
    // the palette never advertises an action that does nothing.
    if (!themeLocked) {
      list.push({
        id: 'theme',
        category: 'Help',
        title: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        subtitle: 'Toggle appearance',
        keywords: 'theme dark light appearance',
        icon:
          theme === 'dark' ? (
            <LightModeRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-amber)' }} />
          ) : (
            <DarkModeRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-violet)' }} />
          ),
        action: go(toggleTheme),
      });
    }

    return list;
  }, [go, onNavigateTab, onQuickCreate, projects, router, theme, themeLocked, toggleTheme]);

  const results = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();

    // Empty query state: the things worth doing without typing anything.
    if (!q) {
      return commands.filter((c) => c.category !== 'Projects' || projects.length <= 5);
    }

    const matched = commands.filter((c) =>
      `${c.title} ${c.subtitle ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(q)
    );

    const matchedTasks: Command[] = tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 6)
      .map((t) => ({
        id: `task-${t.id}`,
        category: 'Tasks' as const,
        title: t.title,
        subtitle: t.sequence ? `#${t.sequence}` : 'Task',
        icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-text-3)' }} />,
        action: go(() => onSelectTask?.(t)),
      }));

    return [...matchedTasks, ...matched];
  }, [commands, go, onSelectTask, projects.length, query, tasks]);

  /** Results in display order, grouped under their category heading. */
  const grouped = useMemo(() => {
    const buckets = new Map<Category, Command[]>();
    for (const cmd of results) {
      const bucket = buckets.get(cmd.category);
      if (bucket) bucket.push(cmd);
      else buckets.set(cmd.category, [cmd]);
    }
    return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((c) => [c, buckets.get(c)!] as const);
  }, [results]);

  /** Flat order must match render order, or arrow keys select the wrong row. */
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  useEffect(() => {
    if (!isOpen) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setSelectedIndex(0);
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // Section 9 — restore focus to whatever opened the dialog.
  useEffect(() => {
    if (isOpen) return;
    restoreFocusTo.current?.focus?.();
    restoreFocusTo.current = null;
  }, [isOpen]);

  // Keep the highlighted row in view when moving by keyboard.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex((i) => (i >= flat.length ? 0 : i));
  }, [flat.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedIndex(Math.max(flat.length - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[selectedIndex]?.action();
    } else if (e.key === 'Tab') {
      // Section 9 — trap focus. The input is the only focusable stop, so the
      // dialog simply keeps it.
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  let renderIndex = -1;

  return (
    <div className="palette-backdrop" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className="palette-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="palette-header">
          <SearchRoundedIcon sx={{ fontSize: 20, color: 'var(--nx-text-3)' }} />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Search tasks, jump to a project, or run a command"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            role="combobox"
            aria-expanded
            aria-controls="palette-results"
            aria-activedescendant={flat[selectedIndex]?.id}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="palette-close-btn" onClick={onClose} aria-label="Close command palette">
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        <div className="palette-list" id="palette-results" role="listbox" ref={listRef}>
          {flat.length === 0 ? (
            /* No-results state (section 5.7) — says what was searched and what
               to do next, rather than only reporting emptiness (section 3.4). */
            <div className="palette-empty">
              <p className="palette-empty__title">No matches for “{query.trim()}”</p>
              <p className="palette-empty__body">
                Try a task title, a project name or its key. You can also create this as a new task.
              </p>
              <button type="button" className="palette-empty__action" onClick={go(onQuickCreate)}>
                <AddCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />
                Create a task
              </button>
            </div>
          ) : (
            grouped.map(([category, items]) => (
              <div className="palette-group" key={category}>
                <div className="palette-group__label">{category}</div>
                {items.map((cmd) => {
                  renderIndex += 1;
                  const index = renderIndex;
                  const selected = index === selectedIndex;
                  return (
                    <div
                      key={cmd.id}
                      id={cmd.id}
                      role="option"
                      aria-selected={selected}
                      data-selected={selected}
                      className={`palette-item ${selected ? 'palette-item--selected' : ''}`}
                      onClick={() => cmd.action()}
                      onMouseMove={() => setSelectedIndex(index)}
                    >
                      <span className="palette-item__icon">{cmd.icon}</span>
                      <span className="palette-item__content">
                        <span className="palette-item__title">{cmd.title}</span>
                        {cmd.subtitle && <span className="palette-item__subtitle">{cmd.subtitle}</span>}
                      </span>
                      {cmd.hint && <kbd className="kbd-shortcut">{cmd.hint}</kbd>}
                      {selected && <kbd className="kbd-shortcut">↵</kbd>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span>
            <kbd className="kbd-shortcut">↑</kbd>
            <kbd className="kbd-shortcut">↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd-shortcut">↵</kbd> select
          </span>
          <span>
            <kbd className="kbd-shortcut">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
