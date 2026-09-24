import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Logo } from '@/components/ui/Logo';
import { DemoEntry } from '@/components/auth/AuthParts';
import { DEMO_COOKIE_NAME, isDemoCookieValue, isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Nexora workspace.',
};

/**
 * Authentication shell. The layout owns the canvas, the brand and the
 * deployment notices; each route supplies the panel from the heading down, so
 * the sign-in screens cannot drift apart.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const inDemo = isDemoCookieValue(cookieStore.get(DEMO_COOKIE_NAME)?.value);
  const configured = isSupabaseConfigured();

  return (
    <div className="auth-root">
      <header className="auth-top">
        <Link href="/" aria-label="Nexora home">
          <Logo size="md" />
        </Link>
        {inDemo ? (
          <Link href="/dashboard" className="auth-top__link">
            Back to the demo →
          </Link>
        ) : (
          <Link href="/" className="auth-top__link">
            ← Home
          </Link>
        )}
      </header>

      <main className="auth-shell">
        {configured && inDemo && (
          <p className="nx-alert nx-alert--info auth-notice" role="status">
            You are in the demo workspace. Signing in switches to your own.
          </p>
        )}
        {/* Without an account service none of these forms can succeed, so
            the demo is offered instead of buttons that would only fail. */}
        <div className="auth-panel">{configured ? children : <AccountsUnavailable />}</div>
      </main>

      {configured && (
        <p className="auth-legal">By continuing you agree to the terms of service and privacy policy.</p>
      )}
    </div>
  );
}

function AccountsUnavailable() {
  return (
    <>
      <h1 className="auth-heading">Accounts are not open yet</h1>
      <p className="auth-subheading">
        This deployment has no sign-in service connected, so there is nothing to sign in to. The demo workspace has
        the whole product: a board, tasks with due dates, sharing and the command palette.
      </p>
      <DemoEntry prominent />
      <p className="auth-footer">No account needed. The demo is shared with other visitors and resets now and then.</p>
    </>
  );
}
