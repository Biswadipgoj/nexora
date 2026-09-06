'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';

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

interface DashboardTopBarProps {
  workspaceName: string;
  projectName: string;
  projectKey: string;
  inboxCount: number;
  activeTab?: 'overview' | 'inbox' | 'tasks' | 'projects';
  notifications?: NotificationItem[];
  onOpenCommandPalette: () => void;
  onQuickCreate: () => void;
  onOpenInbox: () => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onSelectTaskByKey?: (targetKey: string) => void;
  onRequestDesktopNotification?: () => void;
  desktopPermission?: NotificationPermission | 'unsupported';
}

export function DashboardTopBar({
  workspaceName,
  projectName,
  projectKey,
  inboxCount,
  activeTab = 'overview',
  notifications = [],
  onOpenCommandPalette,
  onQuickCreate,
  onOpenInbox,
  onMarkRead,
  onMarkAllRead,
  onSelectTaskByKey,
  onRequestDesktopNotification,
  desktopPermission = 'default',
}: DashboardTopBarProps) {
  const { theme, themeLocked, toggleTheme } = useTheme();

  // Notification Popover state
  const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const isPopoverOpen = Boolean(popoverAnchor);

  const displayedNotifications = notifications.filter((n) => {
    if (filterMode === 'unread') return !n.isRead;
    return true;
  });

  function handleBellClick(event: React.MouseEvent<HTMLButtonElement>) {
    setPopoverAnchor(event.currentTarget);
  }

  function handleClosePopover() {
    setPopoverAnchor(null);
  }

  const getAuthorIcon = (type: string, name: string) => {
    if (type === 'milestone') return <RocketLaunchRoundedIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />;
    if (type === 'assign') return <AssignmentIndRoundedIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />;
    if (type === 'comment') return <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />;
    return <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#FFFFFF' }}>{name.slice(0, 2).toUpperCase()}</span>;
  };

  const getAvatarBg = (type: string) => {
    if (type === 'milestone') return 'linear-gradient(135deg, var(--nx-green) 0%, #059669 100%)';
    if (type === 'assign') return 'linear-gradient(135deg, #2563EB 0%, var(--nx-violet) 100%)';
    return 'linear-gradient(135deg, var(--nx-violet) 0%, #4338CA 100%)';
  };

  return (
    <header className="dash-header glass-panel">
      {/* Left: Dynamic Breadcrumbs & Section badge */}
      <div className="dash-header__left">
        <span className="dash-header__ws">{workspaceName}</span>
        <span className="dash-header__sep">/</span>
        {activeTab === 'inbox' ? (
          <div className="dash-header__project">
            <InboxRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-violet)' }} />
            <span className="dash-header__project-name">Inbox</span>
            {inboxCount > 0 && (
              <span className="dash-header__project-key" style={{ background: 'rgba(225, 29, 72, 0.12)', color: 'var(--nx-rose)' }}>
                {inboxCount} new
              </span>
            )}
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="dash-header__project">
            <AssignmentTurnedInRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-green)' }} />
            <span className="dash-header__project-name">My Tasks</span>
          </div>
        ) : (
          <div className="dash-header__project">
            <FolderSpecialRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-violet)' }} />
            <span className="dash-header__project-name">{projectName}</span>
            <span className="dash-header__project-key">{projectKey}</span>
          </div>
        )}
      </div>

      {/* Middle: Command Palette Quick Trigger */}
      <div className="dash-header__center">
        <button
          className="dash-search-trigger"
          onClick={onOpenCommandPalette}
          aria-label="Search or jump to (Ctrl+K)"
        >
          <SearchRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-text-3)' }} />
          <span className="dash-search-placeholder">Search, jump to, or press</span>
          <span className="kbd-shortcut">Ctrl+K</span>
        </button>
      </div>

      {/* Right: Actions, Notification Bell, New Task */}
      <div className="dash-header__right">
        {!themeLocked && (
          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <LightModeRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-amber)' }} />
            ) : (
              <DarkModeRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-violet)' }} />
            )}
          </button>
        )}

        {/* Notifications Bell with Popover Trigger */}
        <button
          className={`header-icon-btn ${isPopoverOpen ? 'header-icon-btn--active' : ''}`}
          onClick={handleBellClick}
          aria-label="Notifications"
          title="Notifications"
          style={{ position: 'relative' }}
        >
          {inboxCount > 0 ? (
            <NotificationsActiveRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-violet)' }} />
          ) : (
            <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
          )}
          {inboxCount > 0 && <span className="header-badge">{inboxCount}</span>}
        </button>

        {/* New Task Button */}
        <button className="btn-primary-gradient" onClick={onQuickCreate}>
          <AddRoundedIcon sx={{ fontSize: 16 }} />
          <span>New Task</span>
          <span className="kbd-shortcut kbd-shortcut--on-accent" style={{ marginLeft: 4 }}>C</span>
        </button>
      </div>

      {/* Interactive Notifications Popover Menu */}
      <Popover
        open={isPopoverOpen}
        anchorEl={popoverAnchor}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 390,
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: 3.5,
              mt: 1.5,
              backgroundColor: 'var(--nx-surface)',
              border: '1px solid var(--nx-border)',
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.16), 0 0 1px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Popover Header */}
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--nx-border)',
            backgroundColor: 'var(--nx-surface-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--nx-text)' }}>
              Notifications
            </span>
            {inboxCount > 0 && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  backgroundColor: 'var(--nx-violet)',
                  padding: '2px 8px',
                  borderRadius: 9999,
                }}
              >
                {inboxCount} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {inboxCount > 0 && onMarkAllRead && (
              <Button
                size="small"
                onClick={onMarkAllRead}
                startIcon={<DoneAllRoundedIcon sx={{ fontSize: 15 }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--nx-violet)',
                  py: 0.3,
                  px: 1,
                  borderRadius: 1.5,
                }}
              >
                Mark all read
              </Button>
            )}
            <IconButton size="small" onClick={handleClosePopover} sx={{ color: 'var(--nx-text-3)' }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </div>
        </div>

        {/* Filter Chips & Desktop Alert Banner */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--nx-border)', display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filterMode === 'all' ? 'var(--nx-violet)' : 'var(--nx-surface-2)',
              color: filterMode === 'all' ? '#FFFFFF' : 'var(--nx-text-2)',
              transition: 'all 0.15s ease',
            }}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('unread')}
            style={{
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filterMode === 'unread' ? 'var(--nx-violet)' : 'var(--nx-surface-2)',
              color: filterMode === 'unread' ? '#FFFFFF' : 'var(--nx-text-2)',
              transition: 'all 0.15s ease',
            }}
          >
            Unread ({inboxCount})
          </button>
        </div>

        {/* Desktop notification banner if permission not granted */}
        {onRequestDesktopNotification && desktopPermission === 'default' && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(124, 58, 237, 0.06)',
              borderBottom: '1px solid rgba(124, 58, 237, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CampaignRoundedIcon sx={{ fontSize: 18, color: 'var(--nx-violet)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--nx-text)', fontWeight: 500 }}>
                Get instant desktop alerts for team updates
              </span>
            </div>
            <Button
              size="small"
              onClick={onRequestDesktopNotification}
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'none',
                color: '#FFFFFF',
                backgroundColor: 'var(--nx-violet)',
                py: 0.3,
                px: 1.2,
                borderRadius: 1.5,
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: '#6D28D9' },
              }}
            >
              Enable
            </Button>
          </div>
        )}

        {/* Notifications Scrollable List */}
        <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {displayedNotifications.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 36, color: 'var(--nx-green)', mb: 1, opacity: 0.8 }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--nx-text)' }}>
                All caught up!
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--nx-text-3)' }}>
                {filterMode === 'unread' ? 'No unread notifications' : 'No notifications in this workspace'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((item) => {
              const isUnread = !item.isRead;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onMarkRead && isUnread) onMarkRead(item.id);
                    if (item.targetKey && onSelectTaskByKey) {
                      onSelectTaskByKey(item.targetKey);
                      handleClosePopover();
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 12,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--nx-border)',
                    backgroundColor: isUnread ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--nx-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isUnread ? 'rgba(124, 58, 237, 0.04)' : 'transparent';
                  }}
                >
                  {/* Avatar or Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: getAvatarBg(item.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getAuthorIcon(item.type, item.author.name)}
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: isUnread ? 700 : 600,
                            color: 'var(--nx-text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </span>
                        {item.targetKey && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: 'var(--nx-violet)',
                              backgroundColor: 'rgba(124, 58, 237, 0.1)',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {item.targetKey}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--nx-text-3)', flexShrink: 0 }}>
                        {item.timestamp}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: isUnread ? 'var(--nx-text-2)' : 'var(--nx-text-3)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {isUnread && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--nx-violet)',
                        flexShrink: 0,
                        marginTop: 6,
                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Popover Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--nx-border)',
            backgroundColor: 'var(--nx-surface-2)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => {
              handleClosePopover();
              onOpenInbox();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--nx-violet)',
              fontSize: '0.78125rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
            }}
          >
            <span>View all in Activity Inbox</span>
            <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      </Popover>
    </header>
  );
}
