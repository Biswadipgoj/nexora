import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Nexora workspace.',
};

/**
 * Authentication shell — Master Design Document, section 6.2.
 *
 * "Use a centered auth panel over a nearly black canvas with one soft radial
 * light behind the brand mark. Keep the form width between 360 and 440 px.
 * Place the brand, heading, supporting sentence, fields, primary action,
 * recovery links, and demo entry in that order."
 *
 * The layout owns the canvas, the single radial light and the brand. Each auth
 * route supplies the panel contents from the heading down, so the three routes
 * cannot drift apart.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const inDemo = cookieStore.get('nexora_demo_session')?.value === 'true';

  return (
    <div className="auth-root">
      {/* One soft radial light, behind the brand mark. Decorative. */}
      <div className="auth-light" aria-hidden="true" />

      <main className="auth-shell">
        <Link href="/" className="auth-brand" aria-label="Nexora home">
          <Logo size="lg" withText={false} animated />
          <span className="auth-brand__name">Nexora</span>
        </Link>

        {/* Section 3.4 — the demo session is visible state, not a hidden mode
            that silently decides which workspace the user lands in. */}
        {inDemo && (
          <p className="auth-demo-notice">
            You are exploring the demo workspace. Signing in switches to your own.
            <Link href="/dashboard" className="auth-link">
              Back to the demo
            </Link>
          </p>
        )}

        <div className="auth-panel">{children}</div>

        <p className="auth-legal">
          By continuing you agree to the terms of service and privacy policy.
        </p>
      </main>
    </div>
  );
}
