'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { countFocus, sortForFocus, bucketOf, formatDueLabel, isDone, type FocusFilter } from '@/lib/work/focus';
import { itemKey } from '@/lib/work/display';
import type { WorkItemData } from '@/lib/work/types';
import { PriorityMark } from '@/components/ui/Marks';

interface OverviewTabProps {
  user: { name: string };
  workspaceId: string;
  workItems: WorkItemData[];
  projects: Array<{ id: string; name: string; key: string; mode: string }>;
  onOpenItem: (item: WorkItemData) => void;
  /** A metric opens My tasks carrying the filter that produced it. */
  onOpenFiltered: (filter: FocusFilter) => void;
  /** Keeps the metrics in step with the board below them. */
  onItemsChange: (items: WorkItemData[]) => void;
  onQuickCreate: () => void;
  onCreateProject: () => void;
}

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Overview answers three questions in the first viewport: what needs
 * attention, what is moving, and what to open next. Every number is counted
 * from the work items themselves; there is no blocked state in the data
 * model, so the third figure reports work in progress instead of inventing one.
 */
export function OverviewTab({
  user,
  workspaceId,
  workItems,
  projects,
  onOpenItem,
  onOpenFiltered,
  onItemsChange,
  onQuickCreate,
  onCreateProject,
}: OverviewTabProps) {
  const counts = useMemo(() => countFocus(workItems), [workItems]);
  const focusItems = useMemo(() => sortForFocus(workItems.filter((w) => !isDone(w))).slice(0, 6), [workItems]);

  const projectPulse = useMemo(
    () =>
      projects.slice(0, 5).map((project) => {
        const items = workItems.filter((w) => w.project_id === project.id);
        const done = items.filter(isDone).length;
        return {
          ...project,
          total: items.length,
          done,
          percent: items.length > 0 ? Math.round((done / items.length) * 100) : 0,
        };
      }),
    [projects, workItems]
  );

  const activeProject = projects[0];
  const now = new Date();
  const today = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user.name?.split(' ')[0] || 'there';
  const completedShare = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  const metrics: Array<{ filter: FocusFilter; label: string; value: number; caption: string; tone?: 'alert' | 'warn' }> = [
    {
      filter: 'overdue',
      label: 'Overdue',
      value: counts.overdue,
      caption: counts.overdue === 0 ? 'Nothing past due' : 'Past their due date',
      tone: counts.overdue > 0 ? 'alert' : undefined,
    },
    {
      filter: 'due-today',
      label: 'Due today',
      value: counts.dueToday,
      caption: counts.dueToday === 0 ? 'Clear for today' : 'Land these today',
      tone: counts.dueToday > 0 ? 'warn' : undefined,
    },
    { filter: 'in-progress', label: 'In progress', value: counts.inProgress, caption: `of ${counts.open} open` },
    {
      filter: 'completed',
      label: 'Completed',
      value: counts.completed,
      caption: counts.total > 0 ? `${completedShare}% of all work` : 'No work yet',
    },
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="nx-eyebrow">{today}</p>
          <h1 className="page-head__title" style={{ marginTop: 10 }}>
            {greeting(now)}, {firstName}
          </h1>
        </div>
      </header>

      {/* Each figure opens My tasks with its own filter, so the number and the
          list it opens can never disagree. */}
      <section aria-label="Work at a glance" className="ledger">
        {metrics.map((m) => (
          <button
            key={m.filter}
            type="button"
            className={`ledger__cell ${m.tone ? `ledger__cell--${m.tone}` : ''}`}
            onClick={() => onOpenFiltered(m.filter)}
          >
            <span className="ledger__label">{m.label}</span>
            <span className="ledger__value">{m.value}</span>
            <span className="ledger__caption">{m.caption}</span>
          </button>
        ))}
      </section>

      <div className="overview-split">
        <section aria-labelledby="focus-heading">
          <div className="section-head">
            <h2 id="focus-heading" className="section-head__title">
              Up next
            </h2>
            <button type="button" className="section-head__link" onClick={() => onOpenFiltered('all')}>
              All tasks <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </button>
          </div>

          {focusItems.length === 0 ? (
            <div className="nx-empty">
              <p className="nx-empty__title">{counts.total === 0 ? 'Nothing here yet' : 'Everything is done'}</p>
              <p className="nx-empty__body">
                {counts.total === 0
                  ? 'Add a first task and it will show up here and on the board.'
                  : 'Nothing is open right now. Add the next piece of work when you are ready.'}
              </p>
              <div className="nx-empty__actions">
                <button type="button" className="nx-btn nx-btn--secondary nx-btn--sm" onClick={onQuickCreate}>
                  New task
                </button>
              </div>
            </div>
          ) : (
            <ul className="ruled">
              {focusItems.map((item) => {
                const bucket = bucketOf(item);
                const due = formatDueLabel(item);
                const project = projects.find((p) => p.id === item.project_id);
                return (
                  <li key={item.id}>
                    <button type="button" className="focus-row" onClick={() => onOpenItem(item)}>
                      <span className="nx-key">{itemKey(project?.key ?? 'TASK', item.sequence)}</span>
                      <span className="focus-row__title">{item.title}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
                        <PriorityMark priority={item.priority} showLabel={false} />
                        <span className={`focus-row__due due--${bucket}`}>{due ?? 'No date'}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="pulse-heading">
          <div className="section-head">
            <h2 id="pulse-heading" className="section-head__title">
              Projects
            </h2>
            <button type="button" className="section-head__link" onClick={onCreateProject}>
              New project
            </button>
          </div>

          {projectPulse.length === 0 ? (
            <div className="nx-empty">
              <p className="nx-empty__title">No projects yet</p>
              <p className="nx-empty__body">A project groups related work and gives every task a short key.</p>
              <div className="nx-empty__actions">
                <button type="button" className="nx-btn nx-btn--secondary nx-btn--sm" onClick={onCreateProject}>
                  Create a project
                </button>
              </div>
            </div>
          ) : (
            <ul className="ruled">
              {projectPulse.map((project) => (
                <li key={project.id}>
                  <Link href={`/projects/${project.id}`} className="pulse-row">
                    <span className="pulse-row__head">
                      <span className="pulse-row__name">
                        {project.name} <span className="nx-key">{project.key}</span>
                      </span>
                      <span className="pulse-row__meta">
                        {project.total === 0 ? 'No tasks yet' : `${project.done} of ${project.total} done`}
                      </span>
                    </span>
                    <span className="progress" aria-hidden="true">
                      <span className="progress__fill" style={{ width: `${project.percent}%` }} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {activeProject && (
        <section aria-labelledby="board-heading">
          <div className="section-head">
            <h2 id="board-heading" className="section-head__title">
              {activeProject.name}
              <span className="nx-key">{activeProject.key}</span>
            </h2>
            <Link href={`/projects/${activeProject.id}`} className="section-head__link">
              Open board <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Link>
          </div>
          <KanbanBoard
            workspaceId={workspaceId}
            projectId={activeProject.id}
            projectName={activeProject.name}
            projectKey={activeProject.key}
            initialItems={workItems.filter((w) => !w.project_id || w.project_id === activeProject.id)}
            onItemsChange={onItemsChange}
            enableShortcuts={false}
          />
        </section>
      )}
    </>
  );
}
