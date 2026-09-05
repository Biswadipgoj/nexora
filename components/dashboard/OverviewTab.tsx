'use client';

import React from 'react';
import { motion } from 'motion/react';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { KanbanBoard, type WorkItemData } from '@/components/board/KanbanBoard';

interface OverviewTabProps {
  user: { name: string };
  workspaceId: string;
  workItems: WorkItemData[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItemData[]>>;
  projects: Array<{ id: string; name: string; key: string; mode: string }>;
  onOpenItem: (item: WorkItemData) => void;
}

export function OverviewTab({ user, workspaceId, workItems, setWorkItems, projects, onOpenItem }: OverviewTabProps) {
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  const totalPoints = workItems
    .filter((w) => w.status_id === 'status-done')
    .reduce((acc, curr) => acc + (curr.story_points || 0), 0);

  const openBugs = workItems.filter(
    (w) => w.type_id === 'type-bug' && w.status_id !== 'status-done'
  ).length;

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className="tab-content"
    >
      <div className="metrics-grid">
        <div className="material-card">
          <div className="metric-header">
            <span className="metric-label">Sprint Velocity</span>
            <div className="metric-icon-tonal" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <RocketLaunchRoundedIcon sx={{ fontSize: 18 }} />
            </div>
          </div>
          <div className="metric-value">
            {totalPoints} <span className="metric-unit">pts completed</span>
          </div>
          <div className="metric-progress-track">
            <div className="metric-progress-fill" style={{ width: '65%' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 10, fontWeight: 500 }}>
            On track to hit 42 point commitment
          </div>
        </div>

        <div className="material-card">
          <div className="metric-header">
            <span className="metric-label">Platform Stability</span>
            <div className="metric-icon-tonal" style={{ background: '#FEF2F2', color: '#EF4444' }}>
              <TrendingUpRoundedIcon sx={{ fontSize: 18 }} />
            </div>
          </div>
          <div className="metric-value">
            {openBugs} <span className="metric-unit">active regressions</span>
          </div>
          <div className="metric-progress-track">
            <div className="metric-progress-fill" style={{ width: '15%', background: '#EF4444' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 10, fontWeight: 500 }}>
            -2 compared to last week
          </div>
        </div>
      </div>

      <div className="material-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <KanbanBoard
          workspaceId={workspaceId}
          projectId={projects[0]?.id || ''}
          projectName={projects[0]?.name || 'Workspace Board'}
          projectKey={projects[0]?.key || 'APP'}
          projectMode={(projects[0]?.mode as 'simple' | 'advanced') || 'advanced'}
          initialItems={workItems}
        />
      </div>
    </motion.div>
  );
}
