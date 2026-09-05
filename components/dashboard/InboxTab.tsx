'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  author: { name: string; avatar: string };
  targetKey?: string;
}

interface InboxTabProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function InboxTab({ notifications, onMarkRead, onMarkAllRead }: InboxTabProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'mentions') return n.type === 'comment' || n.type === 'assign';
    return true;
  });

  const getAuthorIcon = (type: string, name: string) => {
    if (type === 'milestone') return <RocketLaunchRoundedIcon sx={{ fontSize: 18, color: '#ffffff' }} />;
    if (type === 'assign') return <AssignmentIndRoundedIcon sx={{ fontSize: 18, color: '#ffffff' }} />;
    if (type === 'comment') return <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, color: '#ffffff' }} />;
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (type: string) => {
    if (type === 'milestone') return 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
    if (type === 'assign') return 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';
    return 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
  };

  return (
    <div className="tab-content">
      {/* Tab Header Card */}
      <div className="tab-header-card">
        <div className="tab-header-title-wrap">
          <div className="tab-header-title">
            <NotificationsActiveRoundedIcon sx={{ fontSize: 24, color: 'var(--aurora-iris)' }} />
            <span>Activity Inbox</span>
            {unreadCount > 0 && (
              <span className="nav-badge-pill" style={{ background: '#dc2626', fontSize: '0.75rem' }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="tab-header-desc">
            Stay updated with team discussions, task assignments, and workspace milestones.
          </p>
        </div>

        {unreadCount > 0 && (
          <button className="btn-tab-action" onClick={onMarkAllRead}>
            <DoneAllRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="tab-filter-bar">
        <div className="tab-filter-group">
          <button
            className={`tab-filter-pill ${filter === 'all' ? 'tab-filter-pill--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Activity ({notifications.length})
          </button>
          <button
            className={`tab-filter-pill ${filter === 'unread' ? 'tab-filter-pill--active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`tab-filter-pill ${filter === 'mentions' ? 'tab-filter-pill--active' : ''}`}
            onClick={() => setFilter('mentions')}
          >
            Mentions & Assignments
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="inbox-list">
        <AnimatePresence mode="popLayout">
          {filtered.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`inbox-card ${notif.isRead ? 'inbox-card--read' : 'inbox-card--unread'}`}
              onClick={() => onMarkRead(notif.id)}
            >
              <div
                className="inbox-avatar"
                style={{ background: getAvatarBg(notif.type) }}
              >
                {getAuthorIcon(notif.type, notif.author.name)}
              </div>

              <div className="inbox-content">
                <div className="inbox-card-top">
                  <div className="inbox-card-title">
                    <span>{notif.title}</span>
                    {notif.targetKey && (
                      <span className="inbox-card-key">
                        {notif.targetKey}
                      </span>
                    )}
                  </div>
                  <span className="inbox-card-time">{notif.timestamp}</span>
                </div>

                <div className="inbox-card-desc">
                  {notif.description}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="empty-state-box">
            <MarkEmailReadRoundedIcon sx={{ fontSize: 36, color: 'var(--aurora-jade)', marginBottom: 1 }} />
            <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
              All Caught Up
            </h4>
            <p style={{ fontSize: '0.875rem' }}>
              You have no {filter === 'unread' ? 'unread' : ''} notifications in this workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
