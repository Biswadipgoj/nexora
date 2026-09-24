import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export const metadata = { title: 'Page not found' };

/**
 * Every route produces a useful recovery path. The same page answers
 * "does not exist" and "not yours", so it reveals nothing either way.
 */
export default function NotFound() {
  return (
    <div className="nx-status-page">
      <div className="nx-status-page__inner">
        <Link href="/" aria-label="Nexora home" style={{ marginBottom: 24 }}>
          <Logo size="md" />
        </Link>
        <p className="nx-status-page__code">404 · Not found</p>
        <h1 className="nx-status-page__title">This page is not on the board.</h1>
        <p className="nx-status-page__body">
          The link may be out of date, or the project, task or share it points to was deleted or belongs to a
          workspace you cannot open.
        </p>
        <div className="nx-status-page__actions">
          <Link href="/dashboard" className="nx-btn nx-btn--primary">
            Go to your workspace
          </Link>
          <Link href="/" className="nx-btn nx-btn--ghost">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
