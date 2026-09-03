import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Dashboard — NEXORA',
  description: 'Your NEXORA workspace dashboard.',
};

/**
 * Dashboard page.
 * §5 J1: First-time onboarding — land in Simple Mode with a pre-populated example.
 * §10.3: Primary navigation — Home/My Day, Inbox, My Tasks, workspace switcher.
 * 
 * If the user has no workspaces yet, redirect to workspace creation.
 * If they have workspaces, show the dashboard.
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has any workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, slug, is_personal')
    .limit(5);

  const hasWorkspaces = workspaces && workspaces.length > 0;

  if (!hasWorkspaces) {
    redirect('/onboarding');
  }

  // Find the first non-personal workspace, or fallback to personal
  const primaryWorkspace = workspaces.find(w => !w.is_personal) ?? workspaces[0];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard__sidebar" role="navigation" aria-label="Main navigation">
        <div className="dashboard__sidebar-header">
          <div className="dashboard__logo">
            <Image 
              src="/logo.jpg" 
              alt="NEXORA Logo" 
              width={28} 
              height={28} 
              className="dashboard__logo-img" 
              priority
            />
            <span className="dashboard__logo-text">NEXORA</span>
          </div>
        </div>

        <nav className="dashboard__nav">
          <div className="dashboard__nav-section">
            <a href="/dashboard" className="dashboard__nav-item dashboard__nav-item--active" aria-current="page">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              My Day
            </a>
            <a href="/inbox" className="dashboard__nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
              </svg>
              Inbox
            </a>
            <a href="/my-tasks" className="dashboard__nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              My Tasks
            </a>
          </div>

          <div className="dashboard__nav-divider" />

          <div className="dashboard__nav-section">
            <div className="dashboard__nav-heading">
              Workspace
              <span className="dashboard__badge">{primaryWorkspace.name}</span>
            </div>
          </div>
        </nav>

        <div className="dashboard__sidebar-footer">
          <div className="dashboard__security-status">
            <span className="status-dot" />
            <span className="dashboard__security-label">All systems secure</span>
          </div>
          <div className="dashboard__user-info">
            <div className="dashboard__avatar" aria-hidden="true">
              {user.email?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="dashboard__user-details">
              <span className="dashboard__user-name">
                {user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'}
              </span>
              <span className="dashboard__user-email">{user.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard__main">
        <header className="dashboard__header">
          <div>
            <h1 className="dashboard__title">
              Good {getGreeting()}, {user.user_metadata?.full_name?.split(' ')[0] ?? 'there'}
            </h1>
            <p className="dashboard__date">{formatDate()}</p>
          </div>
          <div className="dashboard__header-actions">
            <kbd className="dashboard__shortcut" title="Quick search (Ctrl+K)">
              ⌘K
            </kbd>
          </div>
        </header>

        {/* Empty state — §30.2: Empty states teach */}
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon">
            <Image 
              src="/empty_state.jpg" 
              alt="Network visualization" 
              width={280} 
              height={180} 
              className="dashboard__empty-img" 
            />
          </div>
          <h2 className="dashboard__empty-title">Your day starts here</h2>
          <p className="dashboard__empty-text">
            Tasks due today, recently assigned items, and personal reminders
            will appear here across all your workspaces.
          </p>
          <div className="dashboard__empty-actions">
            <a href="/onboarding/project" className="dashboard__btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create your first project
            </a>
            <span className="dashboard__shortcut-hint">
              or press <kbd>C</kbd> anytime to quick-create
            </span>
          </div>
        </div>
      </main>

      <style>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg);
        }

        /* === Sidebar === */
        .dashboard__sidebar {
          width: var(--sidebar-width);
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }

        .dashboard__sidebar-header {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .dashboard__logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .dashboard__logo-img {
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
          border-radius: 6px;
          object-fit: cover;
        }

        .dashboard__logo-text {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          letter-spacing: 0.05em;
          color: var(--color-text-primary);
        }

        .dashboard__nav {
          flex: 1;
          padding: var(--space-3) var(--space-3);
        }

        .dashboard__nav-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .dashboard__nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .dashboard__nav-item:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .dashboard__nav-item--active {
          background: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .dashboard__nav-divider {
          height: 1px;
          background: var(--color-border-subtle);
          margin: var(--space-3) 0;
        }

        .dashboard__nav-heading {
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dashboard__badge {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          padding: var(--space-1) var(--space-2);
          background: var(--color-surface-active);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          text-transform: none;
          letter-spacing: normal;
        }

        .dashboard__sidebar-footer {
          padding: var(--space-4) var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .dashboard__security-status {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--color-success-subtle);
          border-radius: var(--radius-md);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .dashboard__security-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-success-text);
        }

        .dashboard__user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .dashboard__avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          flex-shrink: 0;
        }

        .dashboard__user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .dashboard__user-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dashboard__user-email {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* === Main Content === */
        .dashboard__main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .dashboard__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6) var(--space-8);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .dashboard__title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .dashboard__date {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .dashboard__header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .dashboard__shortcut {
          display: inline-flex;
          align-items: center;
          padding: var(--space-1) var(--space-2);
          background: var(--color-surface-active);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        /* === Empty State === */
        .dashboard__empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12);
          text-align: center;
        }

        .dashboard__empty-icon {
          margin-bottom: var(--space-8);
        }

        .dashboard__empty-img {
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-lg);
          object-fit: cover;
        }

        .dashboard__empty-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .dashboard__empty-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          max-width: 400px;
          margin-bottom: var(--space-8);
          line-height: var(--line-height-body);
        }

        .dashboard__empty-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .dashboard__btn-primary {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-6);
          background: var(--color-accent);
          color: var(--color-text-on-primary);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          text-decoration: none;
          transition: background var(--transition-fast);
        }

        .dashboard__btn-primary:hover {
          background: var(--color-accent-hover);
          color: var(--color-text-on-primary);
        }

        .dashboard__shortcut-hint {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        .dashboard__shortcut-hint kbd {
          display: inline-flex;
          align-items: center;
          padding: 0 var(--space-1);
          background: var(--color-surface-active);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin: 0 2px;
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .dashboard__sidebar {
            display: none;
          }
          .dashboard__header {
            padding: var(--space-4) var(--space-5);
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .dashboard__sidebar {
            width: var(--sidebar-collapsed-width);
          }
          .dashboard__logo-text,
          .dashboard__nav-item span,
          .dashboard__user-details,
          .dashboard__nav-heading,
          .dashboard__badge {
            display: none;
          }
          .dashboard__nav-item {
            justify-content: center;
            padding: var(--space-3);
          }
        }
      `}</style>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
