'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { WorkItemDetailDrawer } from '@/components/board/WorkItemDetailDrawer';
import { QuickCreateModal } from '@/components/board/QuickCreateModal';
import { ShareProjectModal } from '@/components/board/ShareProjectModal';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { DashboardTopBar } from './DashboardTopBar';
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
    title: 'New comment on task',
    description: 'Sarah Chen: "Payment intent webhooks tested on testnet. Looks ready for staging deploy!"',
    timestamp: '12m ago',
    isRead: false,
    author: { name: 'Sarah Chen', avatar: '' },
  },
  {
    id: 'n2',
    type: 'assign',
    title: 'Assigned to new work item',
    description: 'You were assigned to: "Performance benchmarking & Cloudflare R2 bucket integration"',
    timestamp: '1h ago',
    isRead: false,
    author: { name: 'Alex Morgan', avatar: '' },
  },
  {
    id: 'n3',
    type: 'milestone',
    title: 'Sprint 1 Milestone Reached',
    description: '75% of sprint story points completed! 4 days remaining in active cycle.',
    timestamp: '5h ago',
    isRead: true,
    author: { name: 'System', avatar: '' },
  },
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const activeProject = projects[0] || {
    id: 'proj-' + primaryWorkspace.id.slice(0, 8),
    name: `${primaryWorkspace.name} Project`,
    key: 'PRJ',
    mode: 'advanced',
  };

  const inboxCount = notifications.filter((n) => !n.isRead).length;

  // Global Shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleTaskStatus = (id: string, currentStatusId: string) => {
    setWorkItems((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            status_id: currentStatusId === 'status-done' ? 'status-in-progress' : 'status-done',
          };
        }
        return w;
      })
    );
  };

  return (
    <div className="dash-root">
      <AnimatedBackground />

      {/* Modern Sidebar Navigation */}
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

      {/* Main Workspace Area */}
      <main className="dash-main">
        {/* Floating Topbar */}
        <DashboardTopBar
          workspaceName={primaryWorkspace.name}
          projectName={activeProject.name}
          projectKey={activeProject.key}
          inboxCount={inboxCount}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onQuickCreate={() => setIsQuickCreateOpen(true)}
          onOpenInbox={() => setActiveTab('inbox')}
        />

        {/* Tab Views */}
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
              currentUserName={user.name}
              onOpenItem={(item) => setSelectedItem(item)}
              onToggleStatus={handleToggleTaskStatus}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        tasks={workItems}
        onSelectTask={(task) => setSelectedItem(task)}
      />

      {/* Task Detail Drawer */}
      <WorkItemDetailDrawer
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        projectKey={activeProject.key}
        onUpdateItem={(updated) => {
          setWorkItems((prev) => prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)));
        }}
        onDeleteItem={(deletedId) => {
          setWorkItems((prev) => prev.filter((w) => w.id !== deletedId));
          setSelectedItem(null);
        }}
      />

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        workspaceId={primaryWorkspace.id}
        projectId={activeProject.id}
        onSuccess={(newItem) => {
          setWorkItems((prev) => [newItem, ...prev]);
        }}
      />

      {/* Share Project Modal */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={activeProject.id}
        projectName={activeProject.name}
        projectKey={activeProject.key}
      />

      {/* Mobile Bottom Navigation Bar */}
      <SuperAppBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'board') {
            setActiveTab('overview');
          } else {
            setActiveTab(tab);
          }
        }}
        onQuickAction={() => setIsActionSheetOpen(true)}
        inboxCount={inboxCount}
        taskCount={workItems.filter((w) => w.status_id !== 'status-done').length}
        projectId={activeProject.id}
      />

      {/* Mobile Action Sheet */}
      <SuperActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        onShareProject={() => setIsShareModalOpen(true)}
        onViewBoard={() => setActiveTab('overview')}
      />
    </div>
  );
}
