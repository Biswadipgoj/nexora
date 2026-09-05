'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { WorkItemCard } from './WorkItemCard';
import { QuickCreateModal } from './QuickCreateModal';
import { WorkItemDetailDrawer } from './WorkItemDetailDrawer';
import { ShareProjectModal } from './ShareProjectModal';
import { SuperAppBottomBar } from '@/components/navigation/SuperAppBottomBar';
import { SuperActionSheet } from '@/components/navigation/SuperActionSheet';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ViewCompactRoundedIcon from '@mui/icons-material/ViewCompactRounded';
import ViewHeadlineRoundedIcon from '@mui/icons-material/ViewHeadlineRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';

export interface StatusColumn {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done' | 'cancelled';
  position: number;
  color: string;
}

export interface WorkItemData {
  id: string;
  workspace_id: string;
  project_id: string;
  sequence: number;
  title: string;
  priority: number;
  status_id: string;
  type_id: string;
  due_date: string | null;
  start_date?: string | null;
  position: number;
  story_points?: number;
  epic_name?: string;
  epic_color?: string;
  assignee?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  assignees?: Array<{
    name: string;
    avatar?: string;
    role?: string;
  }> | null;
  comments?: Array<{
    id: string;
    author: string;
    avatar: string;
    text: string;
    created_at?: string;
    createdAt?: string;
  }> | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoardProps {
  workspaceId: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  projectMode?: 'simple' | 'advanced';
  initialItems?: WorkItemData[];
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'None', color: '#94A3B8' },
  1: { label: 'Low', color: '#3B82F6' },
  2: { label: 'Medium', color: '#EAB308' },
  3: { label: 'High', color: '#F97316' },
  4: { label: 'Urgent', color: '#EF4444' },
};

export function KanbanBoard({
  workspaceId,
  projectId,
  projectKey,
  projectName,
  projectMode = 'simple',
  initialItems,
}: KanbanBoardProps) {
  const [statuses, setStatuses] = useState<StatusColumn[]>([
    { id: 'status-todo', name: 'To Do', category: 'todo', position: 0, color: '#6366F1' },
    { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1, color: '#8B5CF6' },
    { id: 'status-done', name: 'Done', category: 'done', position: 2, color: '#10B981' },
  ]);
  const [types, setTypes] = useState<Array<{ id: string; name: string }>>([
    { id: 'type-task', name: 'Task' },
    { id: 'type-bug', name: 'Bug' },
    { id: 'type-feature', name: 'Feature' },
  ]);
  const [items, setItems] = useState<WorkItemData[]>(initialItems || []);
  const [loading, setLoading] = useState(initialItems ? false : true);
  const [error, setError] = useState<string | null>(null);

  // Nexora Views: 'board' | 'backlog' | 'roadmap'
  const [currentView, setCurrentView] = useState<'board' | 'backlog' | 'roadmap'>('board');

  // Quick Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);

  // Layout & Density
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Modals & Drawers
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkItemData | null>(null);
  const [activeStatusForCreate, setActiveStatusForCreate] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{ id: string; title: string } | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) {
      setLoading(true);
      setError(null);
    }

    if (!projectId) {
      setItems([]);
      setLoading(false);
      return;
    }

    // If initial items were provided from server, don't show loading spinner
    if (isInitial && initialItems && initialItems.length > 0) {
      setLoading(false);
    }

    try {
      const itemsRes = await fetch(`/api/work-items?projectId=${projectId}`);
      if (!itemsRes.ok) {
        const errJson = await itemsRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Could not load work items. Please try again.');
      }
      const itemsData = await itemsRes.json();
      setItems(itemsData.items || []);

      if (itemsData.statuses && itemsData.statuses.length > 0) {
        setStatuses(itemsData.statuses);
      }

      if (itemsData.types && itemsData.types.length > 0) {
        setTypes(itemsData.types);
      }
    } catch (err: unknown) {
      // Only set error if we don't already have items displayed
      if (!initialItems || initialItems.length === 0) {
        setError(err instanceof Error ? err.message : 'Network connection error');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, initialItems]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadData(true);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  // Global 'C' shortcut to open quick create
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsQuickCreateOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Optimistic UI for status transitions
  async function handleStatusChange(itemId: string, newStatusId: string) {
    const previousItems = [...items];

    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status_id: newStatusId } : it))
    );

    try {
      const res = await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: newStatusId }),
      });

      if (!res.ok) {
        setItems(previousItems);
      }
    } catch {
      setItems(previousItems);
    }
  }

  function handleItemCreated(newItem: WorkItemData) {
    setItems((prev) => [newItem, ...prev]);
  }

  function handleItemUpdated(updatedItem: WorkItemData) {
    setItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)));
    if (selectedItem?.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }
  }

  function handleItemDeleted(deletedItemId: string) {
    const deleted = items.find((it) => it.id === deletedItemId);
    if (deleted) {
      setUndoItem({ id: deleted.id, title: deleted.title });
      setTimeout(() => {
        setUndoItem((current) => (current?.id === deletedItemId ? null : current));
      }, 10000);
    }
    setItems((prev) => prev.filter((it) => it.id !== deletedItemId));
  }

  // Available epics for quick filter
  const availableEpics = useMemo(() => {
    const epics = new Set<string>();
    items.forEach((it) => {
      if (it.epic_name) epics.add(it.epic_name);
    });
    return Array.from(epics);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (searchQuery && !it.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (onlyMyIssues && (!it.assignees || !it.assignees.some(a => a.name === 'Alex Morgan'))) {
        return false;
      }
      if (recentlyUpdated) {
        const itemDate = new Date(it.updated_at || it.created_at).getTime();
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (itemDate < oneDayAgo) return false;
      }
      if (selectedPriority !== null && it.priority !== selectedPriority) {
        return false;
      }
      if (selectedEpic !== null && it.epic_name !== selectedEpic) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, onlyMyIssues, recentlyUpdated, selectedPriority, selectedEpic]);

  const hasActiveFilters = Boolean(
    searchQuery || onlyMyIssues || recentlyUpdated || selectedPriority !== null || selectedEpic !== null
  );

  function clearAllFilters() {
    setSearchQuery('');
    setOnlyMyIssues(false);
    setRecentlyUpdated(false);
    setSelectedPriority(null);
    setSelectedEpic(null);
  }

  return (
    <div className={`kanban-board kanban-board--${density}`}>
      {/* Top Header & Toolbar */}
      <div className="kanban-header">
        <div className="kanban-header__left">
          <div className="kanban-title-group">
            <h2 className="kanban-title">{projectName}</h2>
            <Chip
              label={projectKey}
              size="small"
              sx={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                border: '1px solid #C7D2FE',
              }}
            />
            <span className="kanban-mode-indicator">{projectMode} mode</span>
          </div>

          {/* Nexora View Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              borderRadius: 10,
              padding: 3,
              gap: 2,
              marginLeft: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentView('board')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: currentView === 'board' ? '#FFFFFF' : 'transparent',
                color: currentView === 'board' ? '#1E293B' : '#64748B',
                boxShadow: currentView === 'board' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <ViewKanbanRoundedIcon sx={{ fontSize: 16, color: currentView === 'board' ? '#4F46E5' : 'inherit' }} />
              Board
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('backlog')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: currentView === 'backlog' ? '#FFFFFF' : 'transparent',
                color: currentView === 'backlog' ? '#1E293B' : '#64748B',
                boxShadow: currentView === 'backlog' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <FormatListBulletedRoundedIcon sx={{ fontSize: 16, color: currentView === 'backlog' ? '#4F46E5' : 'inherit' }} />
              Backlog
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('roadmap')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: currentView === 'roadmap' ? '#FFFFFF' : 'transparent',
                color: currentView === 'roadmap' ? '#1E293B' : '#64748B',
                boxShadow: currentView === 'roadmap' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <TimelineRoundedIcon sx={{ fontSize: 16, color: currentView === 'roadmap' ? '#4F46E5' : 'inherit' }} />
              Roadmap
            </button>
          </div>
        </div>

        <div className="kanban-header__right">
          {/* Active Collaborators Stack */}
          <div
            onClick={() => setIsShareModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            title="Collaborators & Project Sharing"
          >
            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
              <Avatar alt="Alex Morgan" sx={{ bgcolor: '#4F46E5', fontSize: '0.875rem' }}>AM</Avatar>
              <Avatar alt="Sarah Chen" sx={{ bgcolor: '#EC4899', fontSize: '0.875rem' }}>SC</Avatar>
              <Avatar alt="Biswadip Paul" src="https://github.com/Biswadipgoj.png" />
            </AvatarGroup>
          </div>

          {/* Nexora Share Project Button (Shortlink Enabled) */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => setIsShareModalOpen(true)}
            startIcon={<ShareRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              borderRadius: 2,
              borderColor: '#CBD5E1',
              color: '#334155',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              '&:hover': {
                borderColor: '#6366F1',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
              },
            }}
          >
            Share
          </Button>

          {/* Quick Search */}
          <div className="kanban-search-box">
            <SearchRoundedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search Nexora issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="kanban-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="kanban-search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Density Toggle */}
          <Tooltip title={density === 'comfortable' ? 'Switch to compact view' : 'Switch to comfortable view'}>
            <IconButton
              size="small"
              onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
              sx={{
                color: '#64748B',
                border: '1px solid #E2E8F0',
                borderRadius: 1.5,
                '&:hover': { color: '#0F172A', backgroundColor: '#F8FAFC' },
              }}
            >
              {density === 'comfortable' ? (
                <ViewCompactRoundedIcon sx={{ fontSize: 18 }} />
              ) : (
                <ViewHeadlineRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Refresh */}
          <Tooltip title="Refresh board">
            <IconButton
              size="small"
              onClick={() => loadData(false)}
              sx={{
                color: '#64748B',
                border: '1px solid #E2E8F0',
                borderRadius: 1.5,
                '&:hover': { color: '#0F172A', backgroundColor: '#F8FAFC' },
              }}
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Quick Create CTA */}
          <Button
            variant="contained"
            onClick={() => {
              setActiveStatusForCreate(null);
              setIsQuickCreateOpen(true);
            }}
            startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              py: 0.75,
              px: 1.75,
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}
          >
            Create <kbd className="kbd-shortcut" style={{ marginLeft: 8, color: '#E0E7FF', backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }}>C</kbd>
          </Button>
        </div>
      </div>

      {/* Nexora Quick Filters Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
          <FilterAltRoundedIcon sx={{ fontSize: 16 }} /> Quick Filters:
        </span>

        {/* Only My Issues */}
        <button
          type="button"
          onClick={() => setOnlyMyIssues(!onlyMyIssues)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: onlyMyIssues ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
            backgroundColor: onlyMyIssues ? '#EEF2FF' : '#FFFFFF',
            color: onlyMyIssues ? '#4F46E5' : '#475569',
            transition: 'all 0.15s ease',
          }}
        >
          <Avatar sx={{ width: 16, height: 16, bgcolor: '#4F46E5', fontSize: '0.5rem' }}>AM</Avatar>
          Only my issues
        </button>

        {/* Recently Updated */}
        <button
          type="button"
          onClick={() => setRecentlyUpdated(!recentlyUpdated)}
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: recentlyUpdated ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
            backgroundColor: recentlyUpdated ? '#EEF2FF' : '#FFFFFF',
            color: recentlyUpdated ? '#4F46E5' : '#475569',
            transition: 'all 0.15s ease',
          }}
        >
          Recently updated
        </button>

        {/* Priority Filter Chips */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[3, 4].map((p) => {
            const isSel = selectedPriority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPriority(isSel ? null : p)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSel ? `1.5px solid ${PRIORITY_LABELS[p].color}` : '1px solid #CBD5E1',
                  backgroundColor: isSel ? '#FEF2F2' : '#FFFFFF',
                  color: isSel ? PRIORITY_LABELS[p].color : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <FlagRoundedIcon sx={{ fontSize: 14, color: PRIORITY_LABELS[p].color }} />
                {PRIORITY_LABELS[p].label}
              </button>
            );
          })}
        </div>

        {/* Epics Filter Chips */}
        {availableEpics.map((epic) => {
          const isSel = selectedEpic === epic;
          return (
            <button
              key={epic}
              type="button"
              onClick={() => setSelectedEpic(isSel ? null : epic)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isSel ? '1.5px solid #8B5CF6' : '1px solid #E2E8F0',
                backgroundColor: isSel ? '#F5F3FF' : '#FFFFFF',
                color: isSel ? '#7C3AED' : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              <BoltRoundedIcon sx={{ fontSize: 14, color: '#8B5CF6' }} />
              {epic}
            </button>
          );
        })}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#EF4444',
              textDecoration: 'underline',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD VIEW */}
      {currentView === 'board' && (
        <div className="kanban-columns-track">
          {loading ? (
            <div className="kanban-loading-skeleton">
              {[1, 2, 3].map((col) => (
                <div key={col} className="kanban-column-skeleton">
                  <div className="skeleton" style={{ height: 24, width: 120, marginBottom: 14 }} />
                  <div className="skeleton" style={{ height: 84, marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 84, marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 84 }} />
                </div>
              ))}
            </div>
          ) : (
            statuses.map((status) => {
              const columnItems = filteredItems.filter((it) => it.status_id === status.id);

              return (
                <div key={status.id} className="kanban-column">
                  <div className="kanban-column-header">
                    <div className="kanban-column-title">
                      <span
                        className="kanban-column-dot"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="kanban-column-name">{status.name}</span>
                      <span className="kanban-column-count">{columnItems.length}</span>
                    </div>

                    <Tooltip title={`Add item to ${status.name}`}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setActiveStatusForCreate(status.id);
                          setIsQuickCreateOpen(true);
                        }}
                        sx={{
                          width: 24,
                          height: 24,
                          color: '#64748B',
                          '&:hover': { color: '#0F172A', backgroundColor: '#E2E8F0' },
                        }}
                      >
                        <AddRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </div>

                  <div className="kanban-cards-stack">
                    {columnItems.length === 0 ? (
                      <div className="kanban-empty-column">
                        <span>No items in {status.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStatusForCreate(status.id);
                            setIsQuickCreateOpen(true);
                          }}
                          className="kanban-empty-add-btn"
                        >
                          + Add item
                        </button>
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {columnItems.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                          >
                            <WorkItemCard
                              id={item.id}
                              sequence={item.sequence}
                              projectKey={projectKey}
                              title={item.title}
                              priority={item.priority}
                              statusId={item.status_id}
                              dueDate={item.due_date}
                              typeName="Task"
                              storyPoints={item.story_points}
                              epicName={item.epic_name}
                              epicColor={item.epic_color}
                              assignees={item.assignees}
                              onClick={() => setSelectedItem(item)}
                              onStatusChange={(newSt) => handleStatusChange(item.id, newSt)}
                              availableStatuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: NEXORA BACKLOG / LIST VIEW */}
      {currentView === 'backlog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Sprint Header Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: '16px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  Active Sprint 1
                </span>
                <Chip label="ACTIVE" size="small" sx={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.7rem' }} />
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Ends in 4 days (Sep 11)
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {filteredItems.length} issues • {filteredItems.reduce((acc, it) => acc + (it.story_points || 0), 0)} Story points committed
              </div>
            </div>

            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setActiveStatusForCreate(null);
                setIsQuickCreateOpen(true);
              }}
              startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: 2 }}
            >
              Add issue to sprint
            </Button>
          </div>

          {/* Nexora Table List */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 140px 100px 90px 130px',
                padding: '12px 16px',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <span>Key</span>
              <span>Summary</span>
              <span>Epic</span>
              <span>Points</span>
              <span>Priority</span>
              <span>Status</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
                  No issues found matching active filters.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const statusObj = statuses.find((s) => s.id === item.status_id);
                  const prio = PRIORITY_LABELS[item.priority] || PRIORITY_LABELS[0];

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '120px 1fr 140px 100px 90px 130px',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: '1px solid #F1F5F9',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      {/* Key */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4F46E5', fontSize: '0.8rem' }}>
                        {projectKey}-{item.sequence}
                      </span>

                      {/* Title & Assignee */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16 }}>
                        {item.assignees && item.assignees.length > 0 && (
                          <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.65rem' } }}>
                            {item.assignees.map((a, idx) => (
                              <Tooltip key={idx} title={`Assigned to ${a.name}`}>
                                <Avatar src={a.avatar} alt={a.name} />
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        )}
                        <span style={{ fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </span>
                      </div>

                      {/* Epic */}
                      <div>
                        {item.epic_name ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: item.epic_color || '#8B5CF6',
                              backgroundColor: '#F5F3FF',
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: '1px solid #DDD6FE',
                            }}
                          >
                            <BoltRoundedIcon sx={{ fontSize: 13 }} />
                            {item.epic_name}
                          </span>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>—</span>
                        )}
                      </div>

                      {/* Story Points */}
                      <div>
                        {item.story_points ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              border: '1px solid #C7D2FE',
                            }}
                          >
                            {item.story_points} pts
                          </span>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>—</span>
                        )}
                      </div>

                      {/* Priority */}
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: prio.color, fontWeight: 600, fontSize: '0.75rem' }}>
                          <FlagRoundedIcon sx={{ fontSize: 13 }} />
                          {prio.label}
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <Chip
                          label={statusObj?.name || 'To Do'}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: statusObj?.color ? `${statusObj.color}18` : '#F1F5F9',
                            color: statusObj?.color || '#475569',
                            border: `1px solid ${statusObj?.color || '#CBD5E1'}40`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: NEXORA ROADMAP / TIMELINE VIEW */}
      {currentView === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Professional 3D Isometric Roadmap Hero Banner */}
          <div
            style={{
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              height: 180,
              boxShadow: '0 8px 30px rgba(79, 70, 229, 0.12)',
              border: '1px solid #C7D2FE',
            }}
          >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.65) 50%, rgba(79, 70, 229, 0.4) 100%)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 32px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ maxWidth: 520 }}>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, backgroundColor: 'rgba(99, 102, 241, 0.3)', color: '#A5B4FC', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6, textTransform: 'uppercase' }}>
                  Agile Roadmap & Release Horizon
                </span>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  {projectName} Sprint Timeline
                </h3>
                <p style={{ color: '#CBD5E1', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                  Multi-horizon Gantt mapping epics, milestones, and story estimations for Q3/Q4.
                </p>
              </div>

              <Button
                variant="contained"
                onClick={() => setIsShareModalOpen(true)}
                startIcon={<ShareRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  borderRadius: 2,
                  py: 1,
                  px: 2,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                }}
              >
                Share Roadmap Link
              </Button>
            </div>
          </div>

          {/* Gantt Timeline View */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: 20,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              overflowX: 'auto',
            }}
          >
            {/* Timeline Scale */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '260px repeat(5, 1fr)',
                borderBottom: '2px solid #E2E8F0',
                paddingBottom: 10,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                textAlign: 'center',
              }}
            >
              <span style={{ textAlign: 'left', paddingLeft: 8 }}>Epic / Issue</span>
              <span>Sep 1 - Sep 7</span>
              <span>Sep 8 - Sep 14</span>
              <span>Sep 15 - Sep 21</span>
              <span>Sep 22 - Sep 28</span>
              <span>Sep 29 - Oct 5</span>
            </div>

            {/* Timeline Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>
              {filteredItems.map((item, idx) => {
                const durationOffset = (idx % 4) * 18;
                const barWidth = 35 + (idx % 3) * 15;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '260px 1fr',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Left Key and Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12 }}>
                      {item.assignees && item.assignees.length > 0 && (
                        <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.65rem' } }}>
                          {item.assignees.map((a, idx) => (
                            <Avatar key={idx} src={a.avatar} alt={a.name} />
                          ))}
                        </AvatarGroup>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#6366F1' }}>
                          {projectKey}-{item.sequence}
                        </span>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                      </div>
                    </div>

                    {/* Right Gantt Bar */}
                    <div style={{ position: 'relative', height: 32, backgroundColor: '#F8FAFC', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: `${durationOffset}%`,
                          width: `${barWidth}%`,
                          height: '80%',
                          background: item.epic_color
                            ? `linear-gradient(90deg, ${item.epic_color} 0%, ${item.epic_color}CC 100%)`
                            : 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 10px',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.epic_name ? `${item.epic_name} • ` : ''}{item.story_points ? `${item.story_points} pts` : 'In Progress'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Undo Notification Banner */}
      {undoItem && (
        <div className="kanban-undo-toast" role="status">
          <span>Deleted &quot;{undoItem.title}&quot;</span>
          <button
            type="button"
            className="kanban-undo-btn"
            onClick={async () => {
              try {
                await fetch(`/api/work-items/${undoItem.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ deleted_at: null }),
                });
                setUndoItem(null);
                await loadData(false);
              } catch {
                // Ignore
              }
            }}
          >
            Undo (10s)
          </button>
        </div>
      )}

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        workspaceId={workspaceId}
        projectId={projectId}
        defaultStatusId={activeStatusForCreate || undefined}
        statuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
        types={types}
        onCreated={handleItemCreated}
      />

      {/* Work Item Detail Drawer */}
      <WorkItemDetailDrawer
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        projectKey={projectKey}
        statuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
        types={types}
        onUpdated={handleItemUpdated}
        onDeleted={handleItemDeleted}
      />

      {/* Share Project Modal with Built-in Link Shortener */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
        projectKey={projectKey}
      />

      {/* Super App Mobile Bottom Dock */}
      <SuperAppBottomBar
        activeTab="board"
        onTabChange={(tab) => {
          if (tab === 'overview' || tab === 'tasks' || tab === 'inbox') {
            window.location.href = '/dashboard';
          }
        }}
        onQuickAction={() => setIsActionSheetOpen(true)}
        taskCount={items.filter((w) => w.status_id !== 'status-done').length}
        projectId={projectId}
      />

      {/* Super App Mobile Action Sheet */}
      <SuperActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onQuickCreate={() => setIsQuickCreateOpen(true)}
        onShareProject={() => setIsShareModalOpen(true)}
        onViewBoard={() => setIsActionSheetOpen(false)}
      />
    </div>
  );
}
