'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { countFocus, isDone } from '@/lib/work/focus';
import type { WorkItemData } from '@/lib/work/types';

interface ProjectsTabProps {
  projects: Array<{ id: string; name: string; key: string; mode: string; description?: string | null }>;
  workItems: WorkItemData[];
  onCreateProject?: () => void;
}

/**
 * Every board in the workspace with what is left on each — the same
 * destination the mobile dock's Projects slot opens.
 */
export function ProjectsTab({ projects, workItems, onCreateProject }: ProjectsTabProps) {
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
    <>
      <header className="page-head">
        <div>
          <h1 className="page-head__title">Projects</h1>
          <p className="page-head__sub">
            {projects.length === 0
              ? 'Nothing here yet.'
              : `${projects.length} ${projects.length === 1 ? 'board' : 'boards'} in this workspace.`}
          </p>
        </div>
        {onCreateProject && (
          <div className="page-head__actions">
            <button type="button" className="nx-btn nx-btn--primary" onClick={onCreateProject}>
              <AddRoundedIcon sx={{ fontSize: 17 }} />
              New project
            </button>
          </div>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="nx-empty">
          <p className="nx-empty__title">No projects yet</p>
          <p className="nx-empty__body">A project groups related work and gives every task a short key you can say out loud.</p>
          {onCreateProject && (
            <div className="nx-empty__actions">
              <button type="button" className="nx-btn nx-btn--secondary nx-btn--sm" onClick={onCreateProject}>
                Create a project
              </button>
            </div>
          )}
        </div>
      ) : (
        <section aria-label="All projects">
          <div className="table-head" aria-hidden="true">
            <span>Project</span>
            <span>Key</span>
            <span>Progress</span>
            <span>Open</span>
          </div>
          <ul className="ruled">
            {rows.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`} className="project-row">
                  <span>
                    <span className="project-row__name">{project.name}</span>
                    <span className="project-row__desc">
                      {project.total === 0 ? 'No tasks yet' : `${project.done} of ${project.total} done`}
                      {project.description ? ` · ${project.description}` : ''}
                    </span>
                  </span>
                  <span className="nx-key">{project.key}</span>
                  <span className="progress" aria-label={`${project.percent} percent complete`}>
                    <span className="progress__fill" style={{ width: `${project.percent}%` }} />
                  </span>
                  <span className={`project-row__stat ${project.overdue > 0 ? 'project-row__stat--alert' : ''}`}>
                    {project.overdue > 0 ? `${project.overdue} overdue` : `${project.total - project.done} open`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
