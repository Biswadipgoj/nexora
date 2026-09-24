'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import KeyboardOutlinedIcon from '@mui/icons-material/KeyboardOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import ContrastRoundedIcon from '@mui/icons-material/ContrastRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { useTheme } from '@/components/theme/ThemeProvider';
import './navigation.css';

type Tab = 'overview' | 'inbox' | 'tasks' | 'projects';

interface PaletteTask {
  id: string;
  title: string;
  sequence?: number;
  project_id?: string;
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
  onLogBug?: () => void;
  onCreateProject?: () => void;
  onShowShortcuts?: () => void;
  tasks?: PaletteTask[];
  projects?: PaletteProject[];
  onSelectTask?: (task: PaletteTask) => void;
}

type Category = 'Tasks' | 'Projects' | 'Go to' | 'Create' | 'Appearance' | 'Help';
const CATEGORY_ORDER: Category[] = ['Tasks', 'Projects', 'Go to', 'Create', 'Appearance', 'Help'];

interface Command {
  id: string;
  category: Category;
  title: string;
  subtitle?: string;
  keywords?: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

/**
 * The command palette: navigation, creation, project switching, appearance
 * and help, all from the keyboard. Esc closes it, arrows and Enter work
 * without a pointer, and focus returns to whatever opened it.
 */
export function CommandPalette(props: CommandPaletteProps) {
  if (!props.isOpen) return null;
  return <PaletteDialog {...props} />;
}

function PaletteDialog({
  onClose,
  onNavigateTab,
  onQuickCreate,
  onLogBug,
  onCreateProject,
  onShowShortcuts,
  tasks = [],
  projects = [],
  onSelectTask,
}: CommandPaletteProps) {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Mounted per opening: remember what had focus, and give it back on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      previous?.focus?.();
    };
  }, []);

  const commands = useMemo<Command[]>(() => {
    const go = (fn: () => void) => () => {
      onClose();
      fn();
    };
    const iconSx = { fontSize: 18 };

    const list: Command[] = [
      { id: 'go-overview', category: 'Go to', title: 'Overview', subtitle: 'Figures, focus list and board', keywords: 'home dashboard board', icon: <HomeOutlinedIcon sx={iconSx} />, run: go(() => onNavigateTab('overview')) },
      { id: 'go-inbox', category: 'Go to', title: 'Inbox', subtitle: 'Updates on your work', keywords: 'notifications activity', icon: <InboxOutlinedIcon sx={iconSx} />, run: go(() => onNavigateTab('inbox')) },
      { id: 'go-tasks', category: 'Go to', title: 'My tasks', subtitle: 'Sorted by due date', keywords: 'mine todo list', icon: <TaskAltOutlinedIcon sx={iconSx} />, run: go(() => onNavigateTab('tasks')) },
      { id: 'go-projects', category: 'Go to', title: 'Projects', subtitle: 'Every board in the workspace', keywords: 'boards directory', icon: <FolderOutlinedIcon sx={iconSx} />, run: go(() => onNavigateTab('projects')) },
      { id: 'create-task', category: 'Create', title: 'New task', keywords: 'add issue card', hint: 'C', icon: <AddRoundedIcon sx={iconSx} />, run: go(onQuickCreate) },
    ];

    if (onLogBug) {
      list.push({ id: 'create-bug', category: 'Create', title: 'Log a bug', subtitle: 'Bug category, high priority', keywords: 'defect error issue', icon: <BugReportOutlinedIcon sx={iconSx} />, run: go(onLogBug) });
    }
    if (onCreateProject) {
      list.push({ id: 'create-project', category: 'Create', title: 'New project', keywords: 'board add', icon: <CreateNewFolderOutlinedIcon sx={iconSx} />, run: go(onCreateProject) });
    }

    for (const project of projects) {
      list.push({
        id: `project-${project.id}`,
        category: 'Projects',
        title: project.name,
        subtitle: project.key,
        keywords: project.key,
        icon: <FolderOutlinedIcon sx={iconSx} />,
        run: go(() => router.push(`/projects/${project.id}`)),
      });
    }

    const themes: Array<[typeof preference, string, React.ReactNode]> = [
      ['light', 'Light theme', <LightModeOutlinedIcon key="l" sx={iconSx} />],
      ['dark', 'Dark theme', <DarkModeOutlinedIcon key="d" sx={iconSx} />],
      ['system', 'Match system theme', <ContrastRoundedIcon key="s" sx={iconSx} />],
    ];
    for (const [value, title, icon] of themes) {
      if (value === preference) continue;
      list.push({ id: `theme-${value}`, category: 'Appearance', title, keywords: 'theme appearance dark light mode', icon, run: go(() => setPreference(value)) });
    }

    if (onShowShortcuts) {
      list.push({ id: 'help-shortcuts', category: 'Help', title: 'Keyboard shortcuts', keywords: 'keys hotkeys help', hint: '?', icon: <KeyboardOutlinedIcon sx={iconSx} />, run: go(onShowShortcuts) });
    }

    return list;
  }, [onClose, onNavigateTab, onQuickCreate, onLogBug, onCreateProject, onShowShortcuts, projects, router, preference, setPreference]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matched = q
      ? commands.filter((c) => `${c.title} ${c.subtitle ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(q))
      : commands.filter((c) => c.category !== 'Projects' || projects.length <= 5);

    const taskMatches: Command[] = q
      ? tasks
          .filter((t) => t.title.toLowerCase().includes(q) || String(t.sequence ?? '').includes(q))
          .slice(0, 6)
          .map((t) => {
            const key = projects.find((p) => p.id === t.project_id)?.key;
            return {
              id: `task-${t.id}`,
              category: 'Tasks' as const,
              title: t.title,
              subtitle: key && t.sequence ? `${key}-${t.sequence}` : undefined,
              icon: <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16 }} />,
              run: () => {
                onClose();
                onSelectTask?.(t);
              },
            };
          })
      : [];

    const buckets = new Map<Category, Command[]>();
    for (const cmd of [...taskMatches, ...matched]) {
      const bucket = buckets.get(cmd.category);
      if (bucket) bucket.push(cmd);
      else buckets.set(cmd.category, [cmd]);
    }
    return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((c) => [c, buckets.get(c)!] as const);
  }, [commands, query, tasks, projects, onClose, onSelectTask]);

  /** Flat order must match render order, or arrow keys select the wrong row. */
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);
  const activeIndex = selectedIndex < flat.length ? selectedIndex : 0;

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(flat.length ? (activeIndex + 1) % flat.length : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(flat.length ? (activeIndex - 1 + flat.length) % flat.length : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[activeIndex]?.run();
    } else if (e.key === 'Tab') {
      // The input is the dialog's only tab stop, so focus stays inside.
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  let renderIndex = -1;

  return (
    <div className="palette-backdrop" onMouseDown={onClose} role="presentation">
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="palette__search">
          <SearchRoundedIcon sx={{ fontSize: 20 }} />
          <input
            ref={inputRef}
            className="palette__input"
            placeholder="Search tasks, projects and commands"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={flat[activeIndex]?.id}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="nx-kbd">esc</kbd>
        </div>

        <div className="palette__list" id="palette-results" role="listbox" ref={listRef}>
          {flat.length === 0 ? (
            <div className="palette__empty">
              <p className="palette__empty-title">No matches for “{query.trim()}”</p>
              <p className="palette__empty-body">Try a task title, a project name or its key.</p>
              <button
                type="button"
                className="nx-btn nx-btn--secondary nx-btn--sm"
                onClick={() => {
                  onClose();
                  onQuickCreate();
                }}
              >
                Create a task instead
              </button>
            </div>
          ) : (
            grouped.map(([category, items]) => (
              <div className="palette__group" key={category} role="group" aria-label={category}>
                <div className="palette__group-label nx-eyebrow">{category}</div>
                {items.map((cmd) => {
                  renderIndex += 1;
                  const index = renderIndex;
                  return (
                    <div
                      key={cmd.id}
                      id={cmd.id}
                      role="option"
                      aria-selected={index === activeIndex}
                      className="palette__item"
                      onClick={() => cmd.run()}
                      onMouseMove={() => index !== activeIndex && setSelectedIndex(index)}
                    >
                      <span className="palette__item-icon">{cmd.icon}</span>
                      <span className="palette__item-text">
                        <span className="palette__item-title">{cmd.title}</span>
                        {cmd.subtitle && <span className="palette__item-sub">{cmd.subtitle}</span>}
                      </span>
                      {cmd.hint && <kbd className="nx-kbd">{cmd.hint}</kbd>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="palette__foot">
          <span>
            <kbd className="nx-kbd">↑</kbd>
            <kbd className="nx-kbd">↓</kbd> move
          </span>
          <span>
            <kbd className="nx-kbd">↵</kbd> open
          </span>
          <span>
            <kbd className="nx-kbd">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
