'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import type { WorkItemData } from '@/components/board/KanbanBoard';
import { countFocus, isDone } from '@/lib/work/focus';

interface ProjectsTabProps {
  projects: Array<{ id: string; name: string; key: string; mode: string }>;
  workItems: WorkItemData[];
}

/**
 * Project directory — Master Design Document, sections 5.2 and 6.4.
 *
 * Section 6.4 requires the Android dock to "preserve the same four
 * destinations: Home, Inbox, My Tasks, and Projects". The dock previously sent
 * its second slot to a single hard-coded project UUID, so on any workspace
 * whose first project was not the demo one it opened a dead board, and there
 * was no route to the project list at all below 900px. This is that
 * destination.
 */
export function ProjectsTab({ projects, workItems }: ProjectsTabProps) {
  const rows = useMemo(
    () =>
      projects.map((project) => {
        const items = workItems.filter((w) => w.project_id === project.id);
        const counts = countFocus(items);
        const done = items.filter(isDone).length;
        return {
          ...project,
          total: items.length,
          done,
          overdue: counts.overdue,
          percent: items.length > 0 ? Math.round((done / items.length) * 100) : 0,
        };
      }),
    [projects, workItems]
  );

  return (
    <motion.div
      key="projects"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="tab-content"
    >
      <div className="tab-header-card">
        <div className="tab-header-title-wrap">
          <div className="tab-header-title">
            <FolderOpenRoundedIcon sx={{ fontSize: 24, color: 'var(--nx-blue)' }} />
            <span>Projects</span>
            <span className="nav-badge-pill" style={{ background: 'var(--nx-blue)', fontSize: '0.75rem' }}>
              {projects.length}
            </span>
          </div>
          <p className="tab-header-desc">Every board in this workspace, with what is left to do on each.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state-box">
          <FolderOpenRoundedIcon sx={{ fontSize: 32, color: 'var(--nx-text-3)', marginBottom: 1 }} />
          <h4 className="empty-state-box__title">No projects yet</h4>
          <p className="empty-state-box__body">
            A project groups related work and gives every task a short key you can say out loud.
          </p>
          <div className="empty-state-box__actions">
            <Link href="/onboarding/project" className="overview-empty__action">
              <AddRoundedIcon sx={{ fontSize: 16 }} />
              Create a project
            </Link>
          </div>
        </div>
      ) : (
        <ul className="project-directory">
          {rows.map((project) => (
            <li key={project.id}>
              <Link href={`/projects/${project.id}`} className="project-directory__row">
                <span className="project-directory__main">
                  <span className="project-directory__name">{project.name}</span>
                  <span className="project-directory__meta">
                    {project.total === 0
                      ? 'No tasks yet'
                      : `${project.done} of ${project.total} done`}
                    {project.overdue > 0 && (
                      <span className="project-directory__overdue">{project.overdue} overdue</span>
                    )}
                  </span>
                </span>

                <span className="project-directory__right">
                  <span className="pulse-row__key">{project.key}</span>
                  <span className="project-directory__track" aria-hidden="true">
                    <span className="pulse-row__fill" style={{ width: `${project.percent}%` }} />
                  </span>
                  <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-text-3)' }} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
