'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkItemDetailDrawer } from '@/components/board/WorkItemDetailDrawer';
import { QuickCreateModal } from '@/components/board/QuickCreateModal';
import { ShareProjectModal } from '@/components/board/ShareProjectModal';
import { CreateProjectModal } from '@/components/board/CreateProjectModal';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { ShortcutsDialog } from '@/components/navigation/ShortcutsDialog';
import { SuperAppBottomBar } from '@/components/navigation/SuperAppBottomBar';
import { SuperActionSheet } from '@/components/navigation/SuperActionSheet';
import { isDone, type FocusFilter } from '@/lib/work/focus';
import type { WorkItemData } from '@/lib/work/types';
import { createClient } from '@/lib/supabase/client';
import { DashboardTopBar } from './DashboardTopBar';
import { Sidebar, type DashboardTab } from './Sidebar';
import { OverviewTab } from './OverviewTab';
import { InboxTab, type NotificationItem } from './InboxTab';
import { TasksTab } from './TasksTab';
import { ProjectsTab } from './ProjectsTab';
import '@/components/board/board.css';
import './dashboard.css';

interface DashboardProject {
  id: string;
  name: string;
  key: string;
  mode: string;
  description?: string | null;
}

interface DashboardClientViewProps {
  user: { id: string; email?: string; name: string; avatar?: string };
  primaryWorkspace: { id: string; name: string; slug: string };
  projects: DashboardProject[];
  initialWorkItems: WorkItemData[];
  isDemo: boolean;
  initialTab?: DashboardTab;
}

interface QuickCreateState {
  open: boolean;
  key: number;
  typeId?: string;
  priority?: number;
}

type Notice = { tone: 'success' | 'error'; message: string };

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));

export function DashboardClientView({
  user,
  primaryWorkspace,
  projects,
  initialWorkItems,
  isDemo,
  initialTab = 'overview',
}: DashboardClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [workItems, setWorkItems] = useState<WorkItemData[]>(initialWorkItems);
  const [projectList, setProjectList] = useState<DashboardProject[]>(projects);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickCreate, setQuickCreate] = useState<QuickCreateState>({ open: false, key: 0 });
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  /** Every mutation reports its outcome in a toast. */
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // A figure on Overview opens My tasks carrying its own filter.
  const [taskFilter, setTaskFilter] = useState<FocusFilter>('all');
  const openFiltered = (filter: FocusFilter) => {
    setTaskFilter(filter);
    setActiveTab('tasks');
  };

  const activeProject = projectList[0] ?? null;
  const activeProjectId = useRef(activeProject?.id);
  useEffect(() => {
    activeProjectId.current = activeProject?.id;
  }, [activeProject?.id]);

  const selectedItem = selectedId ? workItems.find((w) => w.id === selectedId) ?? null : null;
  const inboxCount = notifications.filter((n) => !n.isRead).length;
  const openTaskCount = workItems.filter((w) => !isDone(w)).length;

  // Notifications come from the API — they used to be a hard-coded list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      } catch {
        // An unreachable inbox shows as empty rather than blocking the page.
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openQuickCreate = useCallback(
    (preset?: { typeId?: string; priority?: number }) => {
      if (!activeProject) {
        setIsCreateProjectOpen(true);
        setNotice({ tone: 'error', message: 'Create a project first — tasks live on a project board.' });
        return;
      }
      setQuickCreate((prev) => ({ open: true, key: prev.key + 1, ...preset }));
    },
    [activeProject]
  );

  const logBug = useCallback(() => openQuickCreate({ typeId: 'type-bug', priority: 3 }), [openQuickCreate]);

  // Global shortcuts: Ctrl/⌘+K palette, C new task, ? shortcuts.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsPaletteOpen((open) => !open);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        openQuickCreate();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openQuickCreate]);

  const handleSelectTaskByKey = (key: string) => {
    const found = workItems.find((w) => {
      if (w.id === key) return true;
      const project = projectList.find((p) => p.id === w.project_id);
      return Boolean(project && w.sequence && `${project.key}-${w.sequence}` === key);
    });
    if (found) setSelectedId(found.id);
    else setActiveTab('tasks');
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Read state is a convenience; a failed write is retried next time.
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      setNotice({ tone: 'error', message: 'Could not mark notifications as read.' });
    }
  };

  /**
   * Toggling a task persists, optimistically, and is rolled back if the write
   * is refused — it used to change local state only and vanish on reload.
   */
  const handleToggleTaskStatus = async (id: string, currentStatusId: string) => {
    const item = workItems.find((w) => w.id === id);
    if (!item) return;
    const wasDone = isDone(item);
    const next = wasDone
      ? { status_id: 'status-todo', status_category: 'todo' }
      : { status_id: 'status-done', status_category: 'done' };

    setWorkItems((prev) => prev.map((w) => (w.id === id ? { ...w, ...next } : w)));

    try {
      const res = await fetch(`/api/work-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: next.status_id }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const payload = await res.json().catch(() => null);
      if (payload?.item) setWorkItems((prev) => prev.map((w) => (w.id === id ? { ...w, ...payload.item } : w)));
    } catch {
      setWorkItems((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status_id: currentStatusId, status_category: item.status_category } : w))
      );
      setNotice({ tone: 'error', message: 'That change could not be saved, so the task was put back.' });
    }
  };

  /** The Overview board reports its project's items; other projects are kept. */
  const handleBoardItemsChange = useCallback((boardItems: WorkItemData[]) => {
    setWorkItems((prev) => {
      const projectId = activeProjectId.current;
      const others = prev.filter((w) => w.project_id && w.project_id !== projectId);
      return [...boardItems, ...others];
    });
  }, []);

  const signOut = async () => {
    try {
      await createClient().auth.signOut();
    } catch {
      // The server route below clears the session either way.
    }
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } finally {
      router.replace(isDemo ? '/' : '/auth/login');
      router.refresh();
    }
  };

  return (
    <div className="dash-root">
      <Sidebar
        user={user}
        primaryWorkspace={primaryWorkspace}
        projects={projectList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickCreate={() => openQuickCreate()}
        onShareProject={() => (activeProject ? setIsShareOpen(true) : setIsCreateProjectOpen(true))}
        onCreateProject={() => setIsCreateProjectOpen(true)}
        onSignOut={signOut}
        inboxCount={inboxCount}
        openTaskCount={openTaskCount}
        isDemo={isDemo}
      />

      <div className="dash-main">
        <DashboardTopBar
          workspaceName={primaryWorkspace.name}
          activeTab={activeTab}
          inboxCount={inboxCount}
          notifications={notifications}
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
          onQuickCreate={() => openQuickCreate()}
          onOpenInbox={() => setActiveTab('inbox')}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onSelectTaskByKey={handleSelectTaskByKey}
        />

        <main className="dash-content" id="dashboard-main">
          {isDemo && (
            <p className="nx-alert nx-alert--info" role="status">
              <span>This is the demo workspace. Changes are shared with other visitors and reset now and then.</span>
              <Link href="/auth/signup" className="nx-alert__action">
                Create your own
              </Link>
            </p>
          )}

          {activeTab === 'overview' && (
            <OverviewTab
              user={user}
              workspaceId={primaryWorkspace.id}
              workItems={workItems}
              projects={projectList}
              onOpenItem={(item) => setSelectedId(item.id)}
              onOpenFiltered={openFiltered}
              onItemsChange={handleBoardItemsChange}
              onQuickCreate={() => openQuickCreate()}
              onCreateProject={() => setIsCreateProjectOpen(true)}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxTab
              notifications={notifications}
              loading={notificationsLoading}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onSelectTaskByKey={handleSelectTaskByKey}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              workItems={workItems}
              projects={projectList}
              currentUserName={user.name}
              filter={taskFilter}
              onFilterChange={setTaskFilter}
              onQuickCreate={() => openQuickCreate()}
              onOpenItem={(item) => setSelectedId(item.id)}
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
        </main>
      </div>

      <div className="nx-notice-region" role="status" aria-live="polite">
        {notice && (
          <div className={`nx-notice nx-notice--${notice.tone}`}>
            <span className="nx-dot" aria-hidden="true" />
            <span className="nx-notice__text">{notice.message}</span>
            <button type="button" className="nx-notice__dismiss" onClick={() => setNotice(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigateTab={setActiveTab}
        onQuickCreate={() => openQuickCreate()}
        onLogBug={logBug}
        onCreateProject={() => setIsCreateProjectOpen(true)}
        onShowShortcuts={() => setIsShortcutsOpen(true)}
        tasks={workItems}
        projects={projectList}
        onSelectTask={(task) => setSelectedId(task.id)}
      />

      <ShortcutsDialog open={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      <WorkItemDetailDrawer
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedId(null)}
        projectKey={projectList.find((p) => p.id === selectedItem?.project_id)?.key ?? activeProject?.key}
        onUpdateItem={(updated) => setWorkItems((prev) => prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)))}
        onDeleteItem={(deletedId) => {
          setWorkItems((prev) => prev.filter((w) => w.id !== deletedId));
          setSelectedId(null);
          setNotice({ tone: 'success', message: 'Task deleted.' });
        }}
      />

      {activeProject && (
        <QuickCreateModal
          key={quickCreate.key}
          isOpen={quickCreate.open}
          onClose={() => setQuickCreate((prev) => ({ ...prev, open: false }))}
          workspaceId={primaryWorkspace.id}
          projectId={activeProject.id}
          projectName={activeProject.name}
          initialTypeId={quickCreate.typeId}
          initialPriority={quickCreate.priority}
          onSuccess={(newItem) => setWorkItems((prev) => [newItem, ...prev])}
          /* Swap the placeholder for the stored row, so its real id and key are
             what later edits use. */
          onItemReconciled={(optimisticId, storedItem) => {
            setWorkItems((prev) => prev.map((w) => (w.id === optimisticId ? storedItem : w)));
            setNotice({
              tone: 'success',
              message: storedItem.sequence ? `Created ${activeProject.key}-${storedItem.sequence}.` : 'Task created.',
            });
          }}
          /* A rejected write withdraws its card rather than leaving a task on
             the board that does not exist. */
          onCreateFailed={(optimisticItem, message) => {
            setWorkItems((prev) => prev.filter((w) => w.id !== optimisticItem.id));
            setNotice({ tone: 'error', message });
          }}
        />
      )}

      {activeProject && (
        <ShareProjectModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          projectId={activeProject.id}
          projectName={activeProject.name}
          projectKey={activeProject.key}
          workspaceId={primaryWorkspace.id}
        />
      )}

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        workspaceId={primaryWorkspace.id}
        onProjectCreated={(newProj) => {
          setProjectList((prev) => [newProj, ...prev]);
          setNotice({ tone: 'success', message: `Project ${newProj.name} created.` });
        }}
      />

      <SuperAppBottomBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAction={() => setIsSheetOpen(true)}
        inboxCount={inboxCount}
        taskCount={openTaskCount}
      />

      <SuperActionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onQuickCreate={() => openQuickCreate()}
        onLogBug={logBug}
        onShareProject={() => (activeProject ? setIsShareOpen(true) : setIsCreateProjectOpen(true))}
        onCreateProject={() => setIsCreateProjectOpen(true)}
      />
    </div>
  );
}
