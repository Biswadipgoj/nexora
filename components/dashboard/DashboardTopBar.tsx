'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Popover from '@mui/material/Popover';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { Logo } from '@/components/ui/Logo';
import type { DashboardTab } from './Sidebar';
import { NotificationRow, type NotificationItem } from './InboxTab';

export type { NotificationItem } from './InboxTab';

const TAB_TITLES: Record<DashboardTab, string> = {
  overview: 'Overview',
  inbox: 'Inbox',
  tasks: 'My tasks',
  projects: 'Projects',
};

interface DashboardTopBarProps {
  workspaceName: string;
  activeTab: DashboardTab;
  inboxCount: number;
  notifications: NotificationItem[];
  onOpenCommandPalette: () => void;
  onQuickCreate: () => void;
  onOpenInbox: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectTaskByKey: (targetKey: string) => void;
}

const noopSubscribe = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function DashboardTopBar({
  workspaceName,
  activeTab,
  inboxCount,
  notifications,
  onOpenCommandPalette,
  onQuickCreate,
  onOpenInbox,
  onMarkRead,
  onMarkAllRead,
  onSelectTaskByKey,
}: DashboardTopBarProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const mac = useSyncExternalStore(noopSubscribe, isApplePlatform, () => false);
  const recent = notifications.slice(0, 6);

  return (
    <header className="dash-topbar">
      <nav className="dash-crumbs" aria-label="Breadcrumb">
        <span className="dash-crumbs__logo">
          <Logo size="sm" withText={false} />
        </span>
        <span className="dash-crumbs__ws">{workspaceName}</span>
        <span className="dash-crumbs__sep" aria-hidden="true">
          /
        </span>
        <span className="dash-crumbs__page" aria-current="page">
          {TAB_TITLES[activeTab]}
        </span>
      </nav>

      <button type="button" className="dash-search" onClick={onOpenCommandPalette} aria-label="Search and commands">
        <SearchRoundedIcon sx={{ fontSize: 17 }} />
        <span className="dash-search__text">Search or jump to…</span>
        <kbd className="nx-kbd">{mac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>

      <div className="dash-topbar__actions">
        <button
          type="button"
          className={`nx-icon-btn ${anchor ? 'nx-icon-btn--active' : ''}`}
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label={inboxCount > 0 ? `Notifications, ${inboxCount} unread` : 'Notifications'}
          aria-haspopup="dialog"
        >
          <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
          {inboxCount > 0 && <span className="dash-bell__badge">{inboxCount}</span>}
        </button>

        <button type="button" className="nx-btn nx-btn--primary dash-topbar__new" onClick={onQuickCreate}>
          <AddRoundedIcon sx={{ fontSize: 17 }} />
          New task
          <kbd className="nx-kbd">C</kbd>
        </button>
      </div>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1 } } }}
      >
        <div className="notif-pop" role="dialog" aria-label="Notifications">
          <div className="notif-pop__head">
            <span className="notif-pop__title">Notifications</span>
            {inboxCount > 0 && (
              <button type="button" className="nx-btn nx-btn--ghost nx-btn--sm" onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="notif-pop__empty">Nothing new. Updates on your work will show up here.</p>
          ) : (
            <ul className="notif-pop__list ruled">
              {recent.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    notification={n}
                    onOpen={() => {
                      if (!n.isRead) onMarkRead(n.id);
                      if (n.targetKey) onSelectTaskByKey(n.targetKey);
                      setAnchor(null);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="notif-pop__foot">
            <button
              type="button"
              className="nx-btn nx-btn--ghost nx-btn--sm nx-btn--block"
              onClick={() => {
                setAnchor(null);
                onOpenInbox();
              }}
            >
              Open inbox
            </button>
          </div>
        </div>
      </Popover>
    </header>
  );
}
