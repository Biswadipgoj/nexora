'use client';

import React, { useState } from 'react';

export interface WorkItemCardProps {
  id: string;
  sequence: number;
  projectKey: string;
  title: string;
  priority: number;
  statusId: string;
  dueDate?: string | null;
  typeName?: string;
  onClick?: () => void;
  onStatusChange?: (newStatusId: string) => void;
  availableStatuses?: Array<{ id: string; name: string }>;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string; symbol: string }> = {
  4: { label: 'Urgent', color: 'var(--color-danger)', symbol: '▲▲' },
  3: { label: 'High', color: 'var(--color-warning)', symbol: '▲' },
  2: { label: 'Medium', color: 'var(--color-info)', symbol: '◆' },
  1: { label: 'Low', color: 'var(--color-text-secondary)', symbol: '▼' },
  0: { label: 'None', color: 'var(--color-text-tertiary)', symbol: '—' },
};

export function WorkItemCard({
  sequence,
  projectKey,
  title,
  priority,
  statusId,
  dueDate,
  typeName = 'Task',
  onClick,
  onStatusChange,
  availableStatuses = [],
}: WorkItemCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const p = PRIORITY_LABELS[priority] ?? PRIORITY_LABELS[0];

  return (
    <div
      className="work-item-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${projectKey}-${sequence}: ${title}, priority ${p.label}`}
    >
      <div className="work-item-card__header">
        <span className="work-item-card__key">
          {projectKey}-{sequence}
        </span>
        <span
          className="work-item-card__priority"
          style={{ color: p.color }}
          title={`Priority: ${p.label}`}
        >
          {p.symbol} {p.label}
        </span>
      </div>

      <div className="work-item-card__title">{title}</div>

      <div className="work-item-card__footer">
        <span className="work-item-card__type-badge">{typeName}</span>

        {dueDate && (
          <span className="work-item-card__due">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {dueDate}
          </span>
        )}

        {/* Quick status mover — 1 interaction per §30.1 */}
        {availableStatuses.length > 0 && (
          <div
            className="work-item-card__status-quick"
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusMenu(!showStatusMenu);
            }}
          >
            <button
              type="button"
              className="work-item-card__status-btn"
              title="Change status"
              aria-label="Change status"
            >
              →
            </button>
            {showStatusMenu && (
              <div className="work-item-card__status-dropdown" role="menu">
                {availableStatuses
                  .filter((s) => s.id !== statusId)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="work-item-card__status-option"
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusMenu(false);
                        onStatusChange?.(s.id);
                      }}
                    >
                      Move to {s.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .work-item-card {
          position: relative;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .work-item-card:hover {
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .work-item-card:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .work-item-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
          font-size: var(--font-size-xs);
        }

        .work-item-card__key {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
        }

        .work-item-card__priority {
          font-weight: var(--font-weight-medium);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .work-item-card__title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          line-height: var(--line-height-body);
          margin-bottom: var(--space-3);
          word-break: break-word;
        }

        .work-item-card__footer {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
        }

        .work-item-card__type-badge {
          padding: 2px 6px;
          background: var(--color-surface-active);
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          font-weight: var(--font-weight-medium);
        }

        .work-item-card__due {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-text-tertiary);
        }

        .work-item-card__status-quick {
          margin-left: auto;
          position: relative;
        }

        .work-item-card__status-btn {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          background: var(--color-surface-hover);
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          transition: background var(--transition-fast);
        }

        .work-item-card__status-btn:hover {
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .work-item-card__status-dropdown {
          position: absolute;
          right: 0;
          bottom: 100%;
          margin-bottom: var(--space-1);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: var(--z-dropdown);
          min-width: 140px;
          padding: var(--space-1);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .work-item-card__status-option {
          text-align: left;
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-xs);
          color: var(--color-text-primary);
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
          width: 100%;
        }

        .work-item-card__status-option:hover {
          background: var(--color-surface-hover);
        }
      `}</style>
    </div>
  );
}
