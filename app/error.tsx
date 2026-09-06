'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

/**
 * Section 10, "Error ambiguity": every error state explains what happened and
 * what to do next, with a retry, back or support path.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[nexora] Unhandled application error:', error);
  }, [error]);

  return (
    <div className="nx-status-page">
      <Logo size="lg" withText={false} />
      <p className="nx-status-page__eyebrow">Something went wrong</p>
      <h1 className="nx-status-page__title">We could not load this view</h1>
      <p className="nx-status-page__body">
        The page failed while loading. Your work is saved — retrying usually resolves it. If it keeps happening, go
        back to your workspace and try again from there.
      </p>
      <div className="nx-status-page__actions">
        <button type="button" onClick={reset} className="nx-status-page__btn nx-status-page__btn--primary">
          Try again
        </button>
        <Link href="/dashboard" className="nx-status-page__btn">
          Go to your workspace
        </Link>
      </div>
      {error.digest && (
        <p className="nx-status-page__digest">
          Reference <code>{error.digest}</code>
        </p>
      )}
    </div>
  );
}
