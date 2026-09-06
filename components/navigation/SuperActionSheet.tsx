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
              backgroundColor: 'rgba(0, 0, 0, 0.50)',
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
              background: 'var(--nx-surface)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: '20px 20px calc(28px + env(safe-area-inset-bottom, 20px))',
              zIndex: 1001,
              boxShadow: '0 -10px 40px rgba(155, 140, 255, 0.2)',
              borderTop: '1px solid var(--nx-border)',
            }}
          >
            {/* Grabber handle */}
            <div
              style={{
                width: 40,
                height: 4,
                backgroundColor: 'var(--nx-border)',
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
                    background: 'linear-gradient(135deg, var(--nx-violet), var(--nx-violet))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--nx-on-accent)',
                  }}
                >
                  <BoltRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--nx-text)', margin: 0 }}>
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
                  background: 'var(--nx-surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  color: 'var(--nx-text-3)',
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
                  border: '1.5px solid rgba(155, 140, 255, 0.2)',
                  background: 'linear-gradient(145deg, var(--nx-surface-2), var(--nx-surface))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(155, 140, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'var(--nx-violet)',
                    color: 'var(--nx-on-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(155, 140, 255, 0.3)',
                  }}
                >
                  <AddTaskRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--nx-text)' }}>
                  Create Task
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--nx-text-3)', marginTop: 2 }}>
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
                  border: '1.5px solid rgba(155, 140, 255, 0.2)',
                  background: 'linear-gradient(145deg, var(--nx-violet-soft), var(--nx-surface))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(155, 140, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'var(--nx-violet)',
                    color: 'var(--nx-on-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(155, 140, 255, 0.3)',
                  }}
                >
                  <ShareRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--nx-text)' }}>
                  Share Project
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--nx-text-3)', marginTop: 2 }}>
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
                  border: '1.5px solid rgba(70, 215, 232, 0.2)',
                  background: 'linear-gradient(145deg, var(--nx-cyan-soft), var(--nx-surface))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(70, 215, 232, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'var(--nx-cyan)',
                    color: 'var(--nx-on-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(70, 215, 232, 0.3)',
                  }}
                >
                  <ViewKanbanRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--nx-text)' }}>
                  Kanban Board
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--nx-text-3)', marginTop: 2 }}>
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
                  border: '1.5px solid rgba(255, 113, 133, 0.2)',
                  background: 'linear-gradient(145deg, var(--nx-red-soft), var(--nx-surface))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(255, 113, 133, 0.08)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'var(--nx-red)',
                    color: 'var(--nx-on-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    boxShadow: '0 4px 10px rgba(255, 113, 133, 0.3)',
                  }}
                >
                  <BugReportRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--nx-text)' }}>
                  Log Bug
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--nx-text-3)', marginTop: 2 }}>
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
