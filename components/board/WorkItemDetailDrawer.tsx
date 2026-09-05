'use client';

import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CircularProgress from '@mui/material/CircularProgress';
import type { WorkItemData } from './KanbanBoard';

export type WorkItemEntity = WorkItemData;

export interface WorkItemDetailDrawerProps {
  item: WorkItemData | null;
  isOpen: boolean;
  onClose: () => void;
  projectKey: string;
  statuses: Array<{ id: string; name: string }>;
  types: Array<{ id: string; name: string }>;
  onUpdated: (updatedItem: WorkItemData) => void;
  onDeleted: (deletedItemId: string) => void;
}

interface WorkItemDetailContentProps {
  item: WorkItemData;
  onClose: () => void;
  projectKey: string;
  statuses: Array<{ id: string; name: string }>;
  types: Array<{ id: string; name: string }>;
  onUpdated: (updatedItem: WorkItemData) => void;
  onDeleted: (deletedItemId: string) => void;
}

const ASSIGNEE_OPTIONS = [
  { name: 'Alex Morgan', avatar: '', role: 'Tech Lead' },
  { name: 'Sarah Chen', avatar: '', role: 'Product Designer' },
  { name: 'Biswadip Paul', avatar: 'https://github.com/Biswadipgoj.png', role: 'Founder & Lead' },
];

const EPIC_OPTIONS = [
  { name: '⚡ Checkout v2', color: '#8B5CF6' },
  { name: '🚀 Onboarding & Auth', color: '#3B82F6' },
  { name: '📱 Native Android Wrapper', color: '#10B981' },
  { name: '⚡ Real-time Sync', color: '#F59E0B' },
];

const STORY_POINTS_OPTIONS = [1, 2, 3, 5, 8, 13];

function WorkItemDetailContent({
  item,
  onClose,
  projectKey,
  statuses,
  types,
  onUpdated,
  onDeleted,
}: WorkItemDetailContentProps) {
  const [title, setTitle] = useState(item.title || '');
  const [statusId, setStatusId] = useState(item.status_id || '');
  const [priority, setPriority] = useState(item.priority || 0);
  const [dueDate, setDueDate] = useState(item.due_date || '');
  const [typeId, setTypeId] = useState(item.type_id || '');
  const [storyPoints, setStoryPoints] = useState<number | undefined>(item.story_points);
  const [epicName, setEpicName] = useState<string | undefined>(item.epic_name);
  const [assigneeNames, setAssigneeNames] = useState<string[]>(item.assignees?.map(a => a.name) || []);
  const [comments, setComments] = useState<any[]>(item.comments || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleFieldSave(updates: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdated({ ...item, ...updates, ...data.item });
      } else {
        // Fallback optimistic update
        onUpdated({ ...item, ...updates } as WorkItemData);
      }
    } catch {
      onUpdated({ ...item, ...updates } as WorkItemData);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      author: 'Alex Morgan',
      avatar: '',
      text: newCommentText.trim(),
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    setNewCommentText('');
    await handleFieldSave({ comments: updated });
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this item? You can undo this action within 10 seconds.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted(item.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  const createdAtText = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today';
  const updatedAtText = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Just now';

  return (
    <>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Chip
            label={`${projectKey}-${item.sequence}`}
            sx={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.8rem',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              border: '1px solid #C7D2FE',
            }}
          />
          {saving && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.75rem',
                color: '#6366F1',
                fontWeight: 600,
              }}
            >
              <CircularProgress size={12} color="inherit" />
              Saving...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            size="small"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: '0.75rem',
              color: '#DC2626',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#FEE2E2',
              },
            }}
          >
            Delete
          </Button>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: '#64748B',
              '&:hover': { color: '#0F172A', backgroundColor: '#F1F5F9' },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </div>
      </div>

      {/* Body Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: 16,
          paddingRight: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Title Input */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}
          >
            Issue Title
          </label>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== item.title) {
                handleFieldSave({ title: title.trim() });
              }
            }}
            placeholder="Work item title..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '1rem',
                fontWeight: 600,
                color: '#0F172A',
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: 1.5 },
              },
            }}
          />
        </div>

        {/* Nexora Metadata Panel */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
            padding: 16,
            borderRadius: 14,
            border: '1px solid #E0E7FF',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Nexora Agile Properties
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {/* Status */}
            <TextField
              select
              label="Status"
              value={statusId}
              onChange={(e) => {
                const val = e.target.value;
                setStatusId(val);
                handleFieldSave({ status_id: val });
              }}
              size="small"
              slotProps={{ inputLabel: { sx: { color: '#64748B', fontWeight: 600 } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            >
              {statuses.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Priority */}
            <TextField
              select
              label="Priority"
              value={priority}
              onChange={(e) => {
                const val = parseInt(e.target.value as string, 10);
                setPriority(val);
                handleFieldSave({ priority: val });
              }}
              size="small"
              slotProps={{ inputLabel: { sx: { color: '#64748B', fontWeight: 600 } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            >
              <MenuItem value={0}>None</MenuItem>
              <MenuItem value={1}>Low</MenuItem>
              <MenuItem value={2}>Medium</MenuItem>
              <MenuItem value={3}>High</MenuItem>
              <MenuItem value={4}>Urgent</MenuItem>
            </TextField>

            {/* Type */}
            <TextField
              select
              label="Type"
              value={typeId}
              onChange={(e) => {
                const val = e.target.value;
                setTypeId(val);
                handleFieldSave({ type_id: val });
              }}
              size="small"
              slotProps={{ inputLabel: { sx: { color: '#64748B', fontWeight: 600 } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            >
              {types.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Assignees */}
            <TextField
              select
              label="Assignees"
              value={assigneeNames}
              onChange={(e) => {
                const val = e.target.value as unknown as string[];
                setAssigneeNames(val);
                const sel = val.map(name => ASSIGNEE_OPTIONS.find((a) => a.name === name)).filter(Boolean) as typeof ASSIGNEE_OPTIONS;
                handleFieldSave({ assignees: sel.length > 0 ? sel : null });
              }}
              size="small"
              slotProps={{ 
                select: { 
                  multiple: true,
                  renderValue: (selected) => (selected as string[]).join(', ') || 'Unassigned'
                },
                inputLabel: { sx: { color: '#64748B', fontWeight: 600 } } 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            >
              {ASSIGNEE_OPTIONS.map((a) => (
                <MenuItem key={a.name} value={a.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar src={a.avatar} sx={{ width: 20, height: 20 }} />
                    <span style={{ fontSize: '0.85rem' }}>{a.name}</span>
                  </div>
                </MenuItem>
              ))}
            </TextField>
          </div>

          {/* Epic & Story Points Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
            <TextField
              select
              label="Epic Link"
              value={epicName || 'None'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'None') {
                  setEpicName(undefined);
                  handleFieldSave({ epic_name: null, epic_color: null });
                } else {
                  const sel = EPIC_OPTIONS.find((ep) => ep.name === val);
                  setEpicName(val);
                  handleFieldSave({ epic_name: val, epic_color: sel?.color || '#6366F1' });
                }
              }}
              size="small"
              slotProps={{ inputLabel: { sx: { color: '#64748B', fontWeight: 600 } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            >
              <MenuItem value="None">None</MenuItem>
              {EPIC_OPTIONS.map((ep) => (
                <MenuItem key={ep.name} value={ep.name}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: ep.color }}>
                    <BoltRoundedIcon sx={{ fontSize: 16 }} />
                    {ep.name}
                  </span>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Due Date"
              value={dueDate}
              onChange={(e) => {
                const val = e.target.value;
                setDueDate(val);
                handleFieldSave({ due_date: val || null });
              }}
              size="small"
              slotProps={{ inputLabel: { shrink: true, sx: { color: '#64748B', fontWeight: 600 } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            />
          </div>

          {/* Story Points Selector */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
              Story Points (Fibonacci)
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STORY_POINTS_OPTIONS.map((pts) => {
                const isSelected = storyPoints === pts;
                return (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => {
                      const nextPts = isSelected ? undefined : pts;
                      setStoryPoints(nextPts);
                      handleFieldSave({ story_points: nextPts || null });
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: isSelected ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                      backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                      color: isSelected ? '#4F46E5' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pts} {pts === 1 ? 'pt' : 'pts'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nexora Activity & Comments Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Activity & Comments ({comments.length})
            </span>
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#4F46E5', fontSize: '0.8rem', border: '2px solid #E0E7FF' }}>AM</Avatar>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Add a Nexora team comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    '& fieldset': { borderColor: '#E2E8F0' },
                  },
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  size="small"
                  variant="contained"
                  disabled={!newCommentText.trim()}
                  endIcon={<SendRoundedIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  }}
                >
                  Post Comment
                </Button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {comments.map((comm) => (
              <div
                key={comm.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  background: '#FFFFFF',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <Avatar sx={{ width: 28, height: 28, border: '1px solid #E2E8F0', bgcolor: '#8B5CF6', fontSize: '0.75rem' }}>
                  {comm.author ? comm.author.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : 'U'}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{comm.author}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                      {comm.created_at || comm.createdAt ? new Date(comm.created_at || comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.45 }}>{comm.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamps & Info */}
        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
          <span>Created on {createdAtText}</span>
          <span>Last modified on {updatedAtText}</span>
        </div>
      </div>
    </>
  );
}

export function WorkItemDetailDrawer({
  item,
  isOpen,
  onClose,
  projectKey,
  statuses,
  types,
  onUpdated,
  onDeleted,
}: WorkItemDetailDrawerProps) {
  if (!item) return null;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 460, md: 520 },
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(226, 232, 240, 0.6)',
            boxShadow: '-8px 0 32px rgba(99, 102, 241, 0.08)',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <WorkItemDetailContent
        key={item.id}
        item={item}
        onClose={onClose}
        projectKey={projectKey}
        statuses={statuses}
        types={types}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
      />
    </Drawer>
  );
}
