'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AddTaskRoundedIcon from '@mui/icons-material/AddTaskRounded';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';

export interface SuperActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickCreate: () => void;
  onShareProject: () => void;
  onViewBoard?: () => void;
}

export function SuperActionSheet({
  isOpen,
  onClose,
  onQuickCreate,
  onShareProject,
  onViewBoard,
}: SuperActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="super-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1000,
            }}
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            className="super-sheet-modal"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '85vh',
              background: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: '20px 20px calc(28px + env(safe-area-inset-bottom, 20px))',
              zIndex: 1001,
              boxShadow: '0 -10px 40px rgba(79, 70, 229, 0.2)',
              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            }}
          >
            {/* Grabber handle */}
            <div
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#CBD5E1',
                borderRadius: 999,
                margin: '0 auto 16px',
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                  }}
                >
                  <BoltRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Quick Actions
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Action Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {/* Action 1: New Issue */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  onQuickCreate();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px',
                  borderRadius: 16,
                  border: '1.5px solid rgba(99, 102, 241, 0.2)',
                  background: 'linear-gradient(135deg, #EEF2FF, #FFFFFF)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  <AddTaskRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                  Create Task
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748B', marginTop: 2 }}>
                  Assign to team or guest
                </span>
              </motion.button>

              {/* Action 2: Share Project */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  onShareProject();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px',
                  borderRadius: 16,
                  border: '1.5px solid rgba(236, 72, 153, 0.2)',
                  background: 'linear-gradient(135deg, #FDF2F8, #FFFFFF)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#EC4899',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)',
                  }}
                >
                  <ShareRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                  Share Project
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748B', marginTop: 2 }}>
                  Invite guests & short link
                </span>
              </motion.button>

              {/* Action 3: Kanban Board */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  if (onViewBoard) {
                    onViewBoard();
                  } else {
                    window.location.href = '/projects/d0000000-0000-4000-8000-000000000001';
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px',
                  borderRadius: 16,
                  border: '1.5px solid rgba(14, 165, 233, 0.2)',
                  background: 'linear-gradient(135deg, #F0F9FF, #FFFFFF)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#0EA5E9',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)',
                  }}
                >
                  <ViewKanbanRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                  Kanban Board
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748B', marginTop: 2 }}>
                  Interactive agile swimlanes
                </span>
              </motion.button>

              {/* Action 4: Bug Report */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  onQuickCreate();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px',
                  borderRadius: 16,
                  border: '1.5px solid rgba(239, 68, 68, 0.2)',
                  background: 'linear-gradient(135deg, #FEF2F2, #FFFFFF)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <BugReportRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                  Log Bug
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748B', marginTop: 2 }}>
                  Urgent triage priority
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
