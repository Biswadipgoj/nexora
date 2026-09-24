'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Starts a demo session and opens the sample workspace. */
export function DemoWorkspaceButton({
  className = 'nx-btn nx-btn--secondary nx-btn--lg',
  label = 'Explore the demo',
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function launch() {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoading(false);
      setFailed(true);
    }
  }

  return (
    <button type="button" onClick={launch} disabled={loading} className={className} aria-live="polite">
      {loading && <span className="nx-spinner" aria-hidden="true" />}
      {loading ? 'Opening the demo…' : failed ? 'Could not open the demo — try again' : label}
    </button>
  );
}
