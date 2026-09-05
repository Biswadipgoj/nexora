'use client';

import React from 'react';
import { motion } from 'motion/react';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import { KanbanBoard, type WorkItemData } from '@/components/board/KanbanBoard';

interface OverviewTabProps {
  user: { name: string };
  workspaceId: string;
  workItems: WorkItemData[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItemData[]>>;
  projects: Array<{ id: string; name: string; key: string; mode: string }>;
  onOpenItem: (item: WorkItemData) => void;
}

export function OverviewTab({
  user,
  workspaceId,
  workItems,
  setWorkItems,
  projects,
  onOpenItem,
}: OverviewTabProps) {
  const activeTasks = workItems.filter((w) => !w.status_id?.toLowerCase().includes('done')).length;
  const completedTasks = workItems.filter((w) => w.status_id?.toLowerCase().includes('done')).length;
  const totalTasks = workItems.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeProject = projects[0] || {
    id: 'proj-default',
    name: 'Workspace Board',
    key: 'PRJ',
    mode: 'advanced',
  };

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}
    >
      {/* 3 Metric Cards */}
      <div className="metrics-grid">
        {/* Metric 1: Sprint Progress */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Sprint Completion</span>
            <div className="metric-icon-tonal" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
              <RocketLaunchRoundedIcon sx={{ fontSize: 18 }} />
            </div>
          </div>
          <div className="metric-value">
            {completionRate}% <span className="metric-unit">({completedTasks}/{totalTasks} tasks)</span>
          </div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{ width: `${completionRate}%`, background: 'var(--color-primary-gradient)' }}
            />
          </div>
        </div>

        {/* Metric 2: Open Work Items */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Active Work Items</span>
            <div className="metric-icon-tonal" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <AssignmentTurnedInRoundedIcon sx={{ fontSize: 18 }} />
            </div>
          </div>
          <div className="metric-value">
            {activeTasks} <span className="metric-unit">in flight</span>
          </div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{ width: `${Math.min(activeTasks * 15, 100)}%`, background: '#F59E0B' }}
            />
          </div>
        </div>

        {/* Metric 3: Team Velocity */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Velocity Trend</span>
            <div className="metric-icon-tonal" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <TrendingUpRoundedIcon sx={{ fontSize: 18 }} />
            </div>
          </div>
          <div className="metric-value">
            +24% <span className="metric-unit">vs previous sprint</span>
          </div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{ width: '82%', background: '#10B981' }}
            />
          </div>
        </div>
      </div>

      {/* Main Kanban Board View */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 20,
          boxShadow: 'var(--shadow-sm)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <KanbanBoard
          workspaceId={workspaceId}
          projectId={activeProject.id}
          projectName={activeProject.name}
          projectKey={activeProject.key}
          projectMode={(activeProject.mode as 'simple' | 'advanced') || 'advanced'}
          initialItems={workItems}
        />
      </div>
    </motion.div>
  );
}
