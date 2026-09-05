'use client';

import React, { useState } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CircularProgress from '@mui/material/CircularProgress';

export function DemoWorkspaceButton({ className = '' }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleLaunchDemo() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/dashboard';
        return;
      }
    } catch {
      // Fallback
      window.location.href = '/dashboard';
    }
  }

  return (
    <button
      type="button"
      onClick={handleLaunchDemo}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-[var(--surface-elevated)] px-6 py-3.5 text-sm font-semibold text-[var(--text-main)] shadow-[var(--shadow-sm)] backdrop-blur-xl transition-all hover:border-white/30 hover:bg-[var(--surface-hover)] active:scale-95 cursor-pointer disabled:opacity-75 ${className}`}
    >
      {loading ? (
        <CircularProgress size={18} sx={{ color: 'var(--aurora-amber)' }} />
      ) : (
        <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: 'var(--aurora-amber)' }} />
      )}
      <span>{loading ? 'Launching Demo Workspace...' : 'Explore Demo Workspace'}</span>
    </button>
  );
}
