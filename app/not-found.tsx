import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export const metadata = { title: 'Page not found' };

/**
 * Section 10, "Broken deep links": every route must produce a useful recovery
 * path. Section 3.4: the copy states what happened and what to do next, rather
 * than only reporting that something is missing.
 */
export default function NotFound() {
  return (
    <div className="nx-status-page">
      <Logo size="lg" withText={false} />
      <p className="nx-status-page__eyebrow">404</p>
      <h1 className="nx-status-page__title">We could not find that page</h1>
      <p className="nx-status-page__body">
        The link may be out of date, or the project, task or share you are looking for may have been deleted or moved
        to a workspace you cannot access.
      </p>
      <div className="nx-status-page__actions">
        <Link href="/dashboard" className="nx-status-page__btn nx-status-page__btn--primary">
          Go to your workspace
        </Link>
        <Link href="/" className="nx-status-page__btn">
          Back to home
        </Link>
      </div>
    </div>
  );
}
