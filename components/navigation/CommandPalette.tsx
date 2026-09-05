'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'overview' | 'inbox' | 'tasks') => void;
  onQuickCreate: () => void;
  tasks?: Array<{ id: string; title: string; sequence?: number; priority?: number }>;
  onSelectTask?: (task: any) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  onQuickCreate,
  tasks = [],
  onSelectTask,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Default system commands
  const baseCommands = [
    {
      id: 'cmd-create',
      title: 'Create new task...',
      subtitle: 'Shortcut: C',
      icon: <AddCircleOutlineRoundedIcon sx={{ fontSize: 18, color: '#6366F1' }} />,
      action: () => {
        onClose();
        onQuickCreate();
      },
    },
    {
      id: 'cmd-board',
      title: 'Go to Kanban Board',
      subtitle: 'Overview tab',
      icon: <DashboardRoundedIcon sx={{ fontSize: 18, color: '#8B5CF6' }} />,
      action: () => {
        onClose();
        onNavigateTab('overview');
      },
    },
    {
      id: 'cmd-tasks',
      title: 'Go to My Tasks',
      subtitle: 'Personal action list',
      icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: '#10B981' }} />,
      action: () => {
        onClose();
        onNavigateTab('tasks');
      },
    },
    {
      id: 'cmd-inbox',
      title: 'Go to Inbox',
      subtitle: 'Notifications & updates',
      icon: <InboxRoundedIcon sx={{ fontSize: 18, color: '#0EA5E9' }} />,
      action: () => {
        onClose();
        onNavigateTab('inbox');
      },
    },
    {
      id: 'cmd-theme',
      title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: 'Toggle appearance',
      icon: theme === 'dark' ? (
        <LightModeRoundedIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
      ) : (
        <DarkModeRoundedIcon sx={{ fontSize: 18, color: '#6366F1' }} />
      ),
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  // Matching task results
  const matchingTasks = query.trim()
    ? tasks
        .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map((t) => ({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: `Task #${t.sequence || 1}`,
          icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: '#64748B' }} />,
          action: () => {
            onClose();
            if (onSelectTask) onSelectTask(t);
          },
        }))
    : [];

  const filteredCommands = query.trim()
    ? [
        ...matchingTasks,
        ...baseCommands.filter((c) =>
          c.title.toLowerCase().includes(query.toLowerCase())
        ),
      ]
    : baseCommands;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette-modal glass-panel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="palette-header">
          <SearchRoundedIcon sx={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a command or search tasks..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button className="palette-close-btn" onClick={onClose} aria-label="Close">
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        <div className="palette-list">
          {filteredCommands.length === 0 ? (
            <div className="palette-empty">No matching commands or tasks found.</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`palette-item ${idx === selectedIndex ? 'palette-item--selected' : ''}`}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="palette-item__icon">{cmd.icon}</div>
                <div className="palette-item__content">
                  <div className="palette-item__title">{cmd.title}</div>
                  <div className="palette-item__subtitle">{cmd.subtitle}</div>
                </div>
                {idx === selectedIndex && (
                  <span className="kbd-shortcut">↵</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span>
            <kbd className="kbd-shortcut">↑</kbd> <kbd className="kbd-shortcut">↓</kbd> to navigate
          </span>
          <span>
            <kbd className="kbd-shortcut">↵</kbd> to select
          </span>
          <span>
            <kbd className="kbd-shortcut">esc</kbd> to dismiss
          </span>
        </div>
      </div>

      <style jsx>{`
        .palette-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 14vh;
          animation: fadeIn 0.15s ease-out;
        }

        .palette-modal {
          width: 100%;
          max-width: 580px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-border);
          animation: slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .palette-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .palette-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1rem;
          color: var(--color-text-primary);
          font-family: inherit;
        }

        .palette-close-btn {
          background: transparent;
          border: none;
          color: var(--color-text-tertiary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
        }
        .palette-close-btn:hover {
          color: var(--color-text-primary);
          background: var(--color-surface-hover);
        }

        .palette-list {
          max-height: 340px;
          overflow-y: auto;
          padding: 8px;
        }

        .palette-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .palette-item--selected {
          background: var(--color-surface-active);
        }

        .palette-item__icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .palette-item__content {
          flex: 1;
        }

        .palette-item__title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .palette-item__subtitle {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .palette-empty {
          padding: 32px 16px;
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-tertiary);
        }

        .palette-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: var(--color-bg-subtle);
          border-top: 1px solid var(--color-border);
          font-size: 0.75rem;
          color: var(--color-text-tertiary);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
