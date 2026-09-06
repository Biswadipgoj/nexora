'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import AutorenewRoundedIcon from '@mui/icons-material/Autorenew';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { KanbanBoard, type WorkItemData } from '@/components/board/KanbanBoard';
import {
  countFocus,
  sortForFocus,
  bucketOf,
  formatDueLabel,
  isDone,
  type FocusFilter,
} from '@/lib/work/focus';

interface OverviewTabProps {
  user: { name: string };
  workspaceId: string;
  workItems: WorkItemData[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItemData[]>>;
  projects: Array<{ id: string; name: string; key: string; mode: string }>;
  onOpenItem: (item: WorkItemData) => void;
  /** Section 5.2 — a metric opens My Tasks carrying the filter that produced it. */
  onOpenFiltered: (filter: FocusFilter) => void;
  /** Keeps the priority strip in step with the board below it (section 10). */
  onItemsChange: (items: WorkItemData[]) => void;
  onQuickCreate: () => void;
}

/**
 * Overview — Master Design Document, section 5.2.
 *
 * "The dashboard should answer three questions within the first viewport: What
 * needs attention? What is moving? What should I open next?"
 *
 * Order: header, priority strip, then My focus beside Project pulse, then the
 * board. The strip replaces three loose metric cards, one of which showed a
 * hard-coded "+24% vs previous sprint" that no data backed.
 *
 * Section 5.2 names overdue, due today, blocked and completed. This product has
 * no blocked state in its data model, so the third tile reports In progress —
 * the real signal for "what is moving". Inventing a blocked count would repeat
 * the fabricated-metric problem the strip was built to remove.
 */
export function OverviewTab({
  user,
  workspaceId,
  workItems,
  projects,
  onOpenItem,
  onOpenFiltered,
  onQuickCreate,
  onItemsChange,
}: OverviewTabProps) {
  const counts = useMemo(() => countFocus(workItems), [workItems]);

  const focusItems = useMemo(
    () => sortForFocus(workItems.filter((w) => !isDone(w))).slice(0, 6),
    [workItems]
  );

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

  const activeProject = projects[0] || {
    id: 'proj-default',
    name: 'Workspace Board',
    key: 'PRJ',
    mode: 'advanced',
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const firstName = user.name?.split(' ')[0] || 'there';

  const metrics: Array<{
    filter: FocusFilter;
    label: string;
    value: number;
    caption: string;
    tone: 'red' | 'amber' | 'violet' | 'green';
    icon: React.ReactNode;
  }> = [
    {
      filter: 'overdue',
      label: 'Overdue',
      value: counts.overdue,
      caption: counts.overdue === 0 ? 'Nothing past due' : 'Past their due date',
      tone: 'red',
      icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      filter: 'due-today',
      label: 'Due today',
      value: counts.dueToday,
      caption: counts.dueToday === 0 ? 'Clear for today' : 'Land these today',
      tone: 'amber',
      icon: <TodayRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      filter: 'in-progress',
      label: 'In progress',
      value: counts.inProgress,
      caption: `of ${counts.open} open`,
      tone: 'violet',
      icon: <AutorenewRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      filter: 'completed',
      label: 'Completed',
      value: counts.completed,
      caption: counts.total > 0 ? `${Math.round((counts.completed / counts.total) * 100)}% of all work` : 'No work yet',
      tone: 'green',
      icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="overview-root"
    >
      {/* Header with date context (section 5.2) */}
      <header className="overview-header">
        <div>
          <h1 className="overview-title">Good to see you, {firstName}</h1>
          <p className="overview-date">{today}</p>
        </div>
      </header>

      {/* Priority strip. Every tile is a button that opens My Tasks carrying
          its own filter, so the number and the list can never disagree. */}
      <div className="priority-strip">
        {metrics.map((metric) => (
          <button
            key={metric.filter}
            type="button"
            className={`priority-tile priority-tile--${metric.tone} ${metric.value === 0 ? 'priority-tile--empty' : ''}`}
            onClick={() => onOpenFiltered(metric.filter)}
          >
            <span className="priority-tile__top">
              <span className="priority-tile__label">{metric.label}</span>
              <span className="priority-tile__icon">{metric.icon}</span>
            </span>
            <span className="priority-tile__value">{metric.value}</span>
            <span className="priority-tile__caption">{metric.caption}</span>
          </button>
        ))}
      </div>

      <div className="overview-columns">
        {/* My focus */}
        <section className="overview-panel" aria-labelledby="focus-heading">
          <div className="overview-panel__head">
            <h2 id="focus-heading" className="overview-panel__title">
              My focus
            </h2>
            <button type="button" className="overview-panel__link" onClick={() => onOpenFiltered('all')}>
              View all
              <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </button>
          </div>

          {focusItems.length === 0 ? (
            /* Section 5.2: empty states explain how to create the first project
               or task rather than only saying "No data". */
            <div className="overview-empty">
              <p className="overview-empty__title">
                {counts.total === 0 ? 'No work here yet' : 'Everything is done'}
              </p>
              <p className="overview-empty__body">
                {counts.total === 0
                  ? 'Add your first task to see it show up on the board and in your focus list.'
                  : 'Nothing is open right now. Add the next piece of work when you are ready.'}
              </p>
              <button type="button" className="overview-empty__action" onClick={onQuickCreate}>
                <AddRoundedIcon sx={{ fontSize: 16 }} />
                New task
              </button>
            </div>
          ) : (
            <ul className="focus-list">
              {focusItems.map((item) => {
                const bucket = bucketOf(item);
                const dueLabel = formatDueLabel(item);
                return (
                  <li key={item.id}>
                    <button type="button" className="focus-row" onClick={() => onOpenItem(item)}>
                      <span className={`focus-row__rail focus-row__rail--${bucket}`} aria-hidden="true" />
                      <span className="focus-row__body">
                        <span className="focus-row__title">{item.title}</span>
                        <span className="focus-row__meta">
                          {item.sequence && <span className="focus-row__key">#{item.sequence}</span>}
                          {/* Colour is always paired with text (section 9). */}
                          {dueLabel && (
                            <span className={`focus-row__due focus-row__due--${bucket}`}>{dueLabel}</span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Project pulse */}
        <section className="overview-panel" aria-labelledby="pulse-heading">
          <div className="overview-panel__head">
            <h2 id="pulse-heading" className="overview-panel__title">
              Project pulse
            </h2>
          </div>

          {projectPulse.length === 0 ? (
            <div className="overview-empty">
              <p className="overview-empty__title">No projects yet</p>
              <p className="overview-empty__body">
                A project groups related work and gives every task a short key you can say out loud.
              </p>
              <Link href="/onboarding/project" className="overview-empty__action">
                <AddRoundedIcon sx={{ fontSize: 16 }} />
                Create a project
              </Link>
            </div>
          ) : (
            <ul className="pulse-list">
              {projectPulse.map((project) => (
                <li key={project.id}>
                  <Link href={`/projects/${project.id}`} className="pulse-row">
                    <span className="pulse-row__head">
                      <span className="pulse-row__name">{project.name}</span>
                      <span className="pulse-row__key">{project.key}</span>
                    </span>
                    <span className="pulse-row__track" aria-hidden="true">
                      <span className="pulse-row__fill" style={{ width: `${project.percent}%` }} />
                    </span>
                    <span className="pulse-row__meta">
                      {project.total === 0
                        ? 'No tasks yet'
                        : `${project.done} of ${project.total} done · ${project.percent}%`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Board */}
      <section className="overview-board" aria-label="Project board">
        <KanbanBoard
          workspaceId={workspaceId}
          projectId={activeProject.id}
          projectName={activeProject.name}
          projectKey={activeProject.key}
          projectMode={(activeProject.mode as 'simple' | 'advanced') || 'advanced'}
          initialItems={workItems}
          onItemsChange={onItemsChange}
        />
      </section>
    </motion.div>
  );
}
