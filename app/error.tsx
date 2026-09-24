'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

/** Every error says what happened and offers a retry and a way back. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[nexora] Unhandled application error:', error);
  }, [error]);

  return (
    <div className="nx-status-page">
      <div className="nx-status-page__inner">
        <Link href="/" aria-label="Nexora home" style={{ marginBottom: 24 }}>
          <Logo size="md" />
        </Link>
        <p className="nx-status-page__code">Something went wrong</p>
        <h1 className="nx-status-page__title">This view did not load.</h1>
        <p className="nx-status-page__body">
          Your saved work is safe. Trying again usually fixes it; if it keeps happening, go back to your workspace and
          open this page from there.
        </p>
        <div className="nx-status-page__actions">
          <button type="button" onClick={reset} className="nx-btn nx-btn--primary">
            Try again
          </button>
          <Link href="/dashboard" className="nx-btn nx-btn--ghost">
            Go to your workspace
          </Link>
        </div>
        {error.digest && (
          <p className="nx-status-page__digest">
            Reference <code>{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
