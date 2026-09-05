'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { WorkItemDetailDrawer } from '@/components/board/WorkItemDetailDrawer';
import { QuickCreateModal } from '@/components/board/QuickCreateModal';
import { ShareProjectModal } from '@/components/board/ShareProjectModal';
import type { WorkItemData } from '@/components/board/KanbanBoard';

import { AnimatedBackground } from './AnimatedBackground';
import { Sidebar } from './Sidebar';
import { OverviewTab } from './OverviewTab';
import { InboxTab } from './InboxTab';
import { TasksTab } from './TasksTab';
import { SuperAppBottomBar } from '@/components/navigation/SuperAppBottomBar';
import { SuperActionSheet } from '@/components/navigation/SuperActionSheet';
import './dashboard.css';

interface DashboardClientViewProps {
  user: {
    id: string;
    email?: string;
    name: string;
    avatar?: string;
  };
  primaryWorkspace: {
    id: string;
    name: string;
    slug: string;
  };
  projects: Array<{
    id: string;
    name: string;
    key: string;
    mode: string;
  }>;
  initialWorkItems: WorkItemData[];
  isDemo: boolean;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  author: {
    name: string;
    avatar: string;
  };
  targetKey?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'comment',
    title: 'New comment on APP-104',
    description: 'Sarah Chen: "Payment intent webhooks tested on testnet. Looks ready for staging deploy!"',
    timestamp: '12m ago',
    isRead: false,
    author: { name: 'Sarah Chen', avatar: '' },
    targetKey: 'APP-104',
  },
  {
    id: 'n2',
    type: 'assign',
    title: 'Assigned to APP-98',
    description: 'You were assigned to: "Profile photo upload & Cloudflare R2 bucket integration"',
    timestamp: '1h ago',
    isRead: false,
    author: { name: 'Alex Morgan', avatar: '' },
    targetKey: 'APP-98',
  },
  {
    id: 'n3',
    type: 'invite',
    title: 'New collaborator joined',
    description: 'Biswadip Paul joined Acme Mobile via project short link /s/app',
    timestamp: '3h ago',
    isRead: false,
    author: { name: 'Biswadip Paul', avatar: '' },
  },
  {
    id: 'n4',
    type: 'milestone',
    title: 'Sprint 1 Milestone Reached',
    description: '75% of sprint story points completed! 4 days remaining in active cycle.',
    timestamp: '5h ago',
    isRead: true,
    author: { name: 'System', avatar: '' },
  },
];

const DEFAULT_STATUSES = [
  { id: 'status-todo', name: 'To Do' },
  { id: 'status-in-progress', name: 'In Progress' },
  { id: 'status-done', name: 'Done' },
];

const DEFAULT_TYPES = [
  { id: 'type-task', name: 'Task' },
  { id: 'type-feature', name: 'Feature' },
  { id: 'type-bug', name: 'Bug' },
];

export function DashboardClientView({
  user,
  primaryWorkspace,
  projects,
  initialWorkItems,
  isDemo,
}: DashboardClientViewProps) {
  // Navigation Tabs: 'overview' | 'inbox' | 'tasks'
  const [activeTab, setActiveTab] = useState<'overview' | 'inbox' | 'tasks'>('overview');

  // Work items state
  const [workItems, setWorkItems] = useState<WorkItemData[]>(initialWorkItems);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modal / Drawer state
  const [selectedItem, setSelectedItem] = useState<WorkItemData | null>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const inboxCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleTaskStatus = (id: string, currentStatusId: string) => {
    setWorkItems(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status_id: currentStatusId === 'status-done' ? 'status-in-progress' : 'status-done'
        };
      }
      return w;
    }));
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="dash-root">
      <AnimatedBackground />

      {/* 80% Materialism: Material Navigation Drawer */}
      <Sidebar 
        user={user}
        primaryWorkspace={primaryWorkspace}
        projects={projects}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        onShareProject={() => setIsShareModalOpen(true)}
        inboxCount={inboxCount}
      />

      {/* MAIN CONTENT */}
      <main className="dash-main">
        {/* Top Header Area */}
        <header className="dash-topbar">
          <div>
            <h1 className="topbar-welcome">
              Good morning, <span className="text-vibrant-gradient">{user.name.split(' ')[0]}</span>
            </h1>
            <div className="topbar-date">{today}</div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab 
              user={user}
              workspaceId={primaryWorkspace.id}
              workItems={workItems}
              setWorkItems={setWorkItems}
              projects={projects}
              onOpenItem={(item) => setSelectedItem(item)}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxTab 
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab 
              workItems={workItems}
              onOpenItem={(item) => setSelectedItem(item)}
              onToggleStatus={handleToggleTaskStatus}
            />
          )}
        </AnimatePresence>
      </main>

      {/* DETAIL DRAWER */}
      <WorkItemDetailDrawer
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        projectKey={projects[0]?.key || 'APP'}
        statuses={DEFAULT_STATUSES}
        types={DEFAULT_TYPES}
        onUpdated={(updated) => {
          setWorkItems((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        }}
        onDeleted={(id) => {
          setWorkItems((prev) => prev.filter((w) => w.id !== id));
        }}
      />

      {/* QUICK CREATE MODAL */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        workspaceId={primaryWorkspace.id}
        projectId={projects[0]?.id || ''}
        statuses={DEFAULT_STATUSES}
        types={DEFAULT_TYPES}
        onCreated={(newItem) => {
          setWorkItems((prev) => [newItem, ...prev]);
        }}
      />

      {/* SHARE PROJECT MODAL */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={projects[0]?.id || ''}
        projectName={projects[0]?.name || 'Acme Mobile'}
        projectKey={projects[0]?.key || 'APP'}
      />

      {/* Super App Mobile Bottom Dock */}
      <SuperAppBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'board') {
            window.location.href = `/projects/${projects[0]?.id || 'd0000000-0000-4000-8000-000000000001'}`;
          } else {
            setActiveTab(tab);
          }
        }}
        onQuickAction={() => setIsActionSheetOpen(true)}
        inboxCount={inboxCount}
        taskCount={workItems.filter((w) => w.status_id !== 'status-done').length}
        projectId={projects[0]?.id}
      />

      {/* Super App Mobile Action Sheet */}
      <SuperActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        onShareProject={() => setIsShareModalOpen(true)}
        onViewBoard={() => {
          window.location.href = `/projects/${projects[0]?.id || 'd0000000-0000-4000-8000-000000000001'}`;
        }}
      />
    </div>
  );
}
