'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';

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
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  return (
    <motion.div
      key="inbox"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className="tab-content"
    >
      <div className="material-hero-banner">
        <div className="hero-bg-gradient gradient-2" />
        <div className="material-hero-overlay">
          <div>
            <div className="hero-kicker">Command Center</div>
            <h2 className="hero-heading">Your Inbox</h2>
            <p className="hero-copy">Catch up on mentions, assignments, and critical project updates across all workspaces.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent Activity</h3>
        <button className="open-board-tonal-btn" onClick={onMarkAllRead}>
          <MarkEmailReadRoundedIcon sx={{ fontSize: 16 }} />
          Mark all as read
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="material-list-item"
              style={{
                opacity: notif.isRead ? 0.65 : 1,
                borderLeft: notif.isRead ? '1px solid rgba(226, 232, 240, 0.8)' : '3px solid #4F46E5',
              }}
              onClick={() => onMarkRead(notif.id)}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: notif.isRead ? '#94A3B8' : '#EC4899',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}>
                {notif.author.name === 'System' || notif.author.name === 'CI/CD Pipeline' ? '🤖' : getInitials(notif.author.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{notif.title}</span>
                    {notif.targetKey && (
                      <span className="material-epic-chip" style={{ color: '#4F46E5', backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }}>
                        {notif.targetKey}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{notif.timestamp}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                  {notif.description}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
