'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';

import Image from 'next/image';

export interface WorkItemCardProps {
  id: string;
  sequence: number;
  projectKey: string;
  title: string;
  priority: number;
  statusId: string;
  dueDate?: string | null;
  typeName?: string;
  storyPoints?: number;
  epicName?: string;
  epicColor?: string;
  assignees?: Array<{
    name: string;
    avatar?: string;
    role?: string;
  }> | null;
  onClick?: () => void;
  onStatusChange?: (newStatusId: string) => void;
  availableStatuses?: Array<{ id: string; name: string }>;
}

const PRIORITY_META: Record<number, { label: string; color: string; bg: string; dot: string }> = {
  4: { label: 'Urgent', color: '#DC2626', bg: '#FEF2F2', dot: '#DC2626' },
  3: { label: 'High', color: '#EA580C', bg: '#FFF7ED', dot: '#EA580C' },
  2: { label: 'Medium', color: '#D97706', bg: '#FFFBEB', dot: '#D97706' },
  1: { label: 'Low', color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
  0: { label: 'None', color: '#64748B', bg: '#F8FAFC', dot: '#94A3B8' },
};

export function WorkItemCard({
  sequence,
  projectKey,
  title,
  priority,
  statusId,
  dueDate,
  typeName = 'Task',
  storyPoints,
  epicName,
  epicColor = '#8B5CF6',
  assignees,
  onClick,
  onStatusChange,
  availableStatuses = [],
}: WorkItemCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const p = PRIORITY_META[priority] ?? PRIORITY_META[0];

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleSelectStatus = (newStatusId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
    onStatusChange?.(newStatusId);
  };

  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: 1.01,
        boxShadow: '0 12px 24px -6px rgba(79, 70, 229, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.05)',
        borderColor: '#C7D2FE',
        transition: { duration: 0.16 },
      }}
      whileTap={{ scale: 0.98 }}
      className="work-item-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${projectKey}-${sequence}: ${title}, priority ${p.label}`}
    >
      <div className="work-item-card__header">
        <span className="work-item-card__key">
          {projectKey}-{sequence}
        </span>

        <Tooltip title={`Priority: ${p.label}`} arrow>
          <span
            className="work-item-card__priority-pill"
            style={{ color: p.color, backgroundColor: p.bg }}
          >
            <span
              className="work-item-card__priority-dot"
              style={{ backgroundColor: p.dot }}
            />
            {p.label}
          </span>
        </Tooltip>
      </div>

      {epicName && (
        <div className="work-item-card__epic-row">
          <span
            className="work-item-card__epic-tag"
            style={{
              color: epicColor,
              backgroundColor: `${epicColor}15`,
              borderColor: `${epicColor}35`,
            }}
          >
            ⚡ {epicName}
          </span>
        </div>
      )}

      <div className="work-item-card__title">{title}</div>

      <div className="work-item-card__footer">
        <div className="work-item-card__meta-left">
          <Chip
            label={typeName}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6875rem',
              fontWeight: 500,
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0',
            }}
          />

          {storyPoints !== undefined && (
            <span className="work-item-card__points">
              {storyPoints} pts
            </span>
          )}

          {dueDate && (
            <span className="work-item-card__due">
              <CalendarTodayRoundedIcon sx={{ fontSize: 11, mr: 0.4, opacity: 0.7 }} />
              {dueDate}
            </span>
          )}
        </div>

        <div className="work-item-card__meta-right">
          {assignees && assignees.length > 0 && (
            <AvatarGroup
              max={3}
              sx={{
                '& .MuiAvatar-root': {
                  width: 24,
                  height: 24,
                  fontSize: '0.7rem',
                  border: '1.5px solid #FFFFFF',
                },
              }}
            >
              {assignees.map((a, idx) => (
                <Tooltip key={`${a.name}-${idx}`} title={`Assignee: ${a.name}`} arrow>
                  <Avatar
                    src={a.avatar}
                    sx={{ bgcolor: '#6366F1', color: '#fff', fontWeight: 'bold' }}
                    alt={a.name}
                  >
                    {!a.avatar ? a.name.charAt(0) : ''}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}

          {availableStatuses.length > 0 && (
            <div className="work-item-card__action">
            <Tooltip title="Move status" arrow>
              <IconButton
                size="small"
                onClick={handleOpenMenu}
                sx={{
                  width: 24,
                  height: 24,
                  color: '#94A3B8',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  '&:hover': {
                    backgroundColor: '#F1F5F9',
                    color: '#0F172A',
                    borderColor: '#E2E8F0',
                  },
                }}
                aria-label="Change status"
              >
                <ArrowForwardRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              onClick={(e) => e.stopPropagation()}
              slotProps={{
                paper: {
                  sx: {
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 2,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                    minWidth: 150,
                    py: 0.5,
                  },
                },
              }}
            >
              {availableStatuses
                .filter((s) => s.id !== statusId)
                .map((s) => (
                  <MenuItem
                    key={s.id}
                    onClick={(e) => handleSelectStatus(s.id, e)}
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: '#0F172A',
                      py: 0.8,
                      px: 1.5,
                      '&:hover': {
                        backgroundColor: '#F8FAFC',
                        color: '#2563EB',
                      },
                    }}
                  >
                    <ArrowForwardRoundedIcon sx={{ fontSize: 13, mr: 1, opacity: 0.6 }} />
                    {s.name}
                  </MenuItem>
                ))}
            </Menu>
          </div>
        )}
        </div>
      </div>

      <style>{`
        .work-item-card {
          position: relative;
          background: #FFFFFF;
          border: 1px solid rgba(99, 102, 241, 0.14);
          border-radius: 12px;
          padding: 14px 16px;
          cursor: pointer;
          outline: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.05);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .work-item-card:hover {
          border-color: #818CF8;
          box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.15);
        }

        .work-item-card:focus-visible {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        }

        .work-item-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .work-item-card__key {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          color: #4F46E5;
          background: #EEF2FF;
          border: 1px solid #C7D2FE;
          padding: 2px 8px;
          border-radius: 6px;
          letter-spacing: 0.01em;
        }

        .work-item-card__priority-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .work-item-card__priority-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .work-item-card__title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #0F172A;
          line-height: 1.4;
          word-break: break-word;
        }

        .work-item-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 4px;
          margin-top: 2px;
        }

        .work-item-card__meta-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .work-item-card__due {
          display: inline-flex;
          align-items: center;
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          color: #64748B;
          background: #F8FAFC;
          padding: 1px 6px;
          border-radius: var(--radius-xs);
          border: 1px solid #E2E8F0;
        }

        .work-item-card__epic-row {
          display: flex;
          align-items: center;
        }

        .work-item-card__epic-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 1.5px 7px;
          border-radius: 6px;
          border: 1px solid;
          letter-spacing: 0.01em;
        }

        .work-item-card__points {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #4F46E5;
          background: #EEF2FF;
          padding: 1px 6px;
          border-radius: 9999px;
          border: 1px solid #C7D2FE;
        }

        .work-item-card__meta-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .work-item-card__avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid #6366F1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  );
}
