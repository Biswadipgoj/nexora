'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { WorkItemDetailDrawer } from '@/components/board/WorkItemDetailDrawer';
import { QuickCreateModal } from '@/components/board/QuickCreateModal';
import { ShareProjectModal } from '@/components/board/ShareProjectModal';
import { CreateProjectModal } from '@/components/board/CreateProjectModal';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { DashboardTopBar } from './DashboardTopBar';
import type { WorkItemData } from '@/components/board/KanbanBoard';
import { isDone, type FocusFilter } from '@/lib/work/focus';

import { Sidebar } from './Sidebar';
import { OverviewTab } from './OverviewTab';
import { InboxTab } from './InboxTab';
import { TasksTab } from './TasksTab';
import { ProjectsTab } from './ProjectsTab';
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
    title: 'New comment on Customer Onboarding Flow',
    description: 'Maya Patel: "Final checkout assets and copy look fantastic. Ready for staging review!"',
    timestamp: '12m ago',
    isRead: false,
    author: { name: 'Maya Patel', avatar: '' },
    targetKey: 'APP-102',
  },
  {
    id: 'n2',
    type: 'assign',
    title: 'Assigned to you',
    description: 'Alex Morgan assigned you as lead for: "Quarterly budget allocation & team resource plan"',
    timestamp: '1h ago',
    isRead: false,
    author: { name: 'Alex Morgan', avatar: '' },
    targetKey: 'APP-104',
  },
  {
    id: 'n3',
    type: 'milestone',
    title: 'Sprint 1 milestone reached',
    description: 'All planned work for this milestone is now in Done.',
    timestamp: '4h ago',
    isRead: true,
    author: { name: 'Workspace', avatar: '' },
    targetKey: 'APP-91',
  },
];

export function DashboardClientView({
  user,
  primaryWorkspace,
  projects,
  initialWorkItems,
  isDemo,
}: DashboardClientViewProps) {
  // Navigation Tabs: 'overview' | 'inbox' | 'tasks' | 'projects'
  const [activeTab, setActiveTab] = useState<'overview' | 'inbox' | 'tasks' | 'projects'>('overview');

  // Work items & projects state
  const [workItems, setWorkItems] = useState<WorkItemData[]>(initialWorkItems);
  const [projectList, setProjectList] = useState(projects);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modal / Drawer state
  const [selectedItem, setSelectedItem] = useState<WorkItemData | null>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  /**
   * Section 5.6: "a toast confirms the result." Section 3.4: the user must know
   * whether a change was saved or rejected. Nothing in the product reported the
   * outcome of a mutation before this.
   */
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Section 5.2 — a dashboard metric opens My Tasks carrying its own filter, so
  // the number the user clicked and the list they land on always agree.
  const [taskFilter, setTaskFilter] = useState<FocusFilter>('all');

  const openFiltered = (filter: FocusFilter) => {
    setTaskFilter(filter);
    setActiveTab('tasks');
  };

  const activeProject = projectList[0] || {
    id: 'proj-' + primaryWorkspace.id.slice(0, 8),
    name: `${primaryWorkspace.name} Project`,
    key: 'PRJ',
    mode: 'advanced',
  };

  const inboxCount = notifications.filter((n) => !n.isRead).length;

  // Global Shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K had no input guard, so it hijacked the shortcut while the user
      // was typing in a field (section 3.5, unexpected navigation).
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
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

  /**
   * Toggling a task now persists.
   *
   * This previously mutated React state and made no request at all, while the
   * panel copy above it promised "instant tactile sync" — the change vanished
   * on reload. Section 3.4 requires the user to know whether a change was
   * saved or rejected, and section 3.5 counts a contradictory label as an
   * unresolved defect. The optimistic update stays for responsiveness, and is
   * rolled back if the write is refused.
   */
  const handleToggleTaskStatus = async (id: string, currentStatusId: string) => {
    const nextStatusId = currentStatusId === 'status-done' ? 'status-in-progress' : 'status-done';

    setWorkItems((prev) => prev.map((w) => (w.id === id ? { ...w, status_id: nextStatusId } : w)));

    try {
      const res = await fetch(`/api/work-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: nextStatusId }),
      });

      if (!res.ok) throw new Error(String(res.status));
    } catch {
      // Put the card back where it was rather than showing a state the server
      // never accepted.
      setWorkItems((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status_id: currentStatusId } : w))
      );
    }
  };

  return (
    <div className="dash-root">

      {/* Modern Sidebar Navigation */}
      <Sidebar
        user={user}
        primaryWorkspace={primaryWorkspace}
        projects={projectList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        onShareProject={() => setIsShareModalOpen(true)}
        onCreateProject={() => setIsCreateProjectOpen(true)}
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
          activeTab={activeTab}
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
              projects={projectList}
              onOpenItem={(item) => setSelectedItem(item)}
              onOpenFiltered={openFiltered}
              onItemsChange={setWorkItems}
              onQuickCreate={() => setIsQuickCreateOpen(true)}
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
              filter={taskFilter}
              onFilterChange={setTaskFilter}
              onQuickCreate={() => setIsQuickCreateOpen(true)}
              onOpenItem={(item) => setSelectedItem(item)}
              onToggleStatus={handleToggleTaskStatus}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab
              projects={projectList}
              workItems={workItems}
              onCreateProject={() => setIsCreateProjectOpen(true)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Outcome notice. Polite live region so screen readers hear the result
          without the focus being stolen (section 9). */}
      <div className="nx-notice-region" role="status" aria-live="polite">
        {notice && (
          <div className={`nx-notice nx-notice--${notice.tone}`}>
            <span className="nx-notice__text">{notice.message}</span>
            <button
              type="button"
              className="nx-notice__dismiss"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        tasks={workItems}
        projects={projects}
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
        /* Swap the placeholder for the row the server stored, so its real id and
           sequence are what later edits reference (section 10, stale data). */
        onItemReconciled={(optimisticId, storedItem) => {
          setWorkItems((prev) => prev.map((w) => (w.id === optimisticId ? storedItem : w)));
        }}
        /* A rejected write withdraws its card rather than leaving a task on the
           board that does not exist (section 3.4). */
        onCreateFailed={(optimisticItem, message) => {
          setWorkItems((prev) => prev.filter((w) => w.id !== optimisticItem.id));
          setNotice({ tone: 'error', message });
        }}
      />

      {/* Share Project Modal */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={activeProject.id}
        projectName={activeProject.name}
        projectKey={activeProject.key}
        workspaceId={primaryWorkspace.id}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        workspaceId={primaryWorkspace.id}
        onProjectCreated={(newProj) => {
          setProjectList((prev) => [newProj, ...prev]);
          setNotice({ tone: 'success', message: `Project "${newProj.name}" created successfully!` });
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <SuperAppBottomBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAction={() => setIsActionSheetOpen(true)}
        inboxCount={inboxCount}
        taskCount={workItems.filter((w) => !isDone(w)).length}
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
