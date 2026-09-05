'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import type { WorkItemData } from './KanbanBoard';

export type WorkItemPayload = WorkItemData;

export interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  statuses: Array<{ id: string; name: string }>;
  types: Array<{ id: string; name: string }>;
  defaultStatusId?: string;
  onCreated: (newItem: WorkItemData) => void;
}

const PRIORITIES = [
  { value: 0, label: 'None', color: '#64748B' },
  { value: 1, label: 'Low', color: '#2563EB' },
  { value: 2, label: 'Medium', color: '#D97706' },
  { value: 3, label: 'High', color: '#EA580C' },
  { value: 4, label: 'Urgent', color: '#DC2626' },
];

const ASSIGNEE_OPTIONS = [
  { name: 'Alex Morgan', avatar: '', role: 'Tech Lead' },
  { name: 'Sarah Chen', avatar: '', role: 'Product Designer' },
  { name: 'Biswadip Paul', avatar: 'https://github.com/Biswadipgoj.png', role: 'Founder & Lead' },
];

export function QuickCreateModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  statuses,
  types,
  defaultStatusId,
  onCreated,
}: QuickCreateModalProps) {
  const [title, setTitle] = useState('');
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [priority, setPriority] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [assigneeNames, setAssigneeNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusId = selectedStatusId || defaultStatusId || statuses[0]?.id || '';
  const typeId = selectedTypeId || types[0]?.id || '';

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !statusId || !typeId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          type_id: typeId,
          status_id: statusId,
          title: title.trim(),
          priority,
          due_date: dueDate || undefined,
          assignees: assigneeNames.length > 0 ? assigneeNames.map(name => ASSIGNEE_OPTIONS.find((a) => a.name === name)).filter(Boolean) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not create work item. Please try again.');
      }

      setTitle('');
      setDueDate('');
      setPriority(0);
      setAssigneeNames([]);
      setSelectedStatusId('');
      setSelectedTypeId('');
      onCreated(data.workItem);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create work item. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            p: 1,
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#0F172A',
            pb: 1,
          }}
        >
          New work item
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#64748B',
              '&:hover': { color: '#0F172A', backgroundColor: '#F1F5F9' },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: '0.8125rem',
              }}
            >
              {error}
            </div>
          )}

          <TextField
            autoFocus
            label="What needs to be done?"
            placeholder="e.g., Update customer invoice generation logic"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            variant="outlined"
            slotProps={{ inputLabel: { sx: { color: '#64748B' } } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { borderColor: '#E5E7EB' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1.5 },
              },
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TextField
              select
              label="Type"
              value={typeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { sx: { color: '#64748B' } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E5E7EB' },
                },
              }}
            >
              {types.map((t) => (
                <MenuItem key={t.id} value={t.id} sx={{ color: '#0F172A' }}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={statusId}
              onChange={(e) => setSelectedStatusId(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { sx: { color: '#64748B' } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E5E7EB' },
                },
              }}
            >
              {statuses.map((s) => (
                <MenuItem key={s.id} value={s.id} sx={{ color: '#0F172A' }}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#475467',
                marginBottom: 8,
              }}
            >
              Priority
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: isSelected ? `1.5px solid ${p.color}` : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? '#FFFFFF' : '#F8FAFC',
                      color: isSelected ? p.color : '#64748B',
                      boxShadow: isSelected ? '0 1px 2px rgba(16, 24, 40, 0.05)' : 'none',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: p.color,
                      }}
                    />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TextField
              select
              label="Assignees"
              value={assigneeNames}
              onChange={(e) => setAssigneeNames(e.target.value as unknown as string[])}
              fullWidth
              slotProps={{ 
                select: { 
                  multiple: true,
                  renderValue: (selected) => (selected as string[]).join(', ') || 'Unassigned'
                },
                inputLabel: { sx: { color: '#64748B' } } 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E5E7EB' },
                },
              }}
            >
              {ASSIGNEE_OPTIONS.map((a) => (
                <MenuItem key={a.name} value={a.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar src={a.avatar} sx={{ width: 20, height: 20 }} />
                    <span style={{ fontSize: '0.85rem', color: '#0F172A' }}>{a.name}</span>
                  </div>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Due date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true, sx: { color: '#64748B' } } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#E5E7EB' },
                },
              }}
            />
          </div>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1, justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Press <kbd className="kbd-shortcut">Enter</kbd> to submit
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              onClick={onClose}
              sx={{
                color: '#475467',
                '&:hover': { color: '#0F172A', backgroundColor: '#F1F5F9' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !title.trim()}
              sx={{
                px: 2.5,
              }}
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : 'Create item'}
            </Button>
          </div>
        </DialogActions>
      </form>
    </Dialog>
  );
}
