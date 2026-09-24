'use client';

import React, { useState } from 'react';
import { Avatar } from '@/components/ui/Marks';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  author: { name: string; avatar: string };
  targetKey?: string;
}

type InboxFilter = 'all' | 'unread' | 'mentions';

interface InboxTabProps {
  notifications: NotificationItem[];
  loading?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectTaskByKey?: (targetKey: string) => void;
}

/** One line of activity: who, what, when, and whether you have seen it. */
export function NotificationRow({ notification, onOpen }: { notification: NotificationItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      className={`inbox-row ${notification.isRead ? '' : 'inbox-row--unread'}`}
      onClick={onOpen}
    >
      <Avatar name={notification.author.name} />
      <span>
        <span className="inbox-row__title">{notification.title}</span>
        {notification.description && <span className="inbox-row__desc">{notification.description}</span>}
      </span>
      <span className="inbox-row__side">
        <span>{notification.timestamp}</span>
        {notification.targetKey && <span className="nx-key">{notification.targetKey}</span>}
        {!notification.isRead && <span className="inbox-row__unread" aria-label="Unread" />}
      </span>
    </button>
  );
}

export function InboxTab({ notifications, loading, onMarkRead, onMarkAllRead, onSelectTaskByKey }: InboxTabProps) {
  const [filter, setFilter] = useState<InboxFilter>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const mentionsCount = notifications.filter((n) => n.type === 'comment' || n.type === 'assign').length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'mentions') return n.type === 'comment' || n.type === 'assign';
    return true;
  });

  const filters: Array<[InboxFilter, string, number]> = [
    ['all', 'All', notifications.length],
    ['unread', 'Unread', unreadCount],
    ['mentions', 'Mentions and assignments', mentionsCount],
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-head__title">Inbox</h1>
          <p className="page-head__sub">
            {unreadCount > 0
              ? `${unreadCount} ${unreadCount === 1 ? 'update needs' : 'updates need'} a look.`
              : 'You are up to date.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="page-head__actions">
            <button type="button" className="nx-btn nx-btn--secondary" onClick={onMarkAllRead}>
              Mark all as read
            </button>
          </div>
        )}
      </header>

      <section>
        <div className="nx-segmented" role="group" aria-label="Filter notifications" style={{ marginBottom: 12 }}>
          {filters.map(([value, label, count]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {label} <span className="nx-num">{count}</span>
            </button>
          ))}
        </div>

        {loading && notifications.length === 0 ? (
          <p className="list-note">Loading notifications…</p>
        ) : filtered.length === 0 ? (
          <div className="nx-empty">
            <p className="nx-empty__title">
              {filter === 'unread' ? 'Nothing unread' : filter === 'mentions' ? 'No mentions yet' : 'No notifications yet'}
            </p>
            <p className="nx-empty__body">
              Comments, assignments and status changes on your work collect here, newest first.
            </p>
          </div>
        ) : (
          <ul className="ruled">
            {filtered.map((n) => (
              <li key={n.id}>
                <NotificationRow
                  notification={n}
                  onOpen={() => {
                    if (!n.isRead) onMarkRead(n.id);
                    if (n.targetKey && onSelectTaskByKey) onSelectTaskByKey(n.targetKey);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
