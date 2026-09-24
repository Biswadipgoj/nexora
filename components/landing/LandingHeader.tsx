import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-header__row">
        <Link href="/" aria-label="Nexora home">
          <Logo size="md" />
        </Link>

        <nav className="lp-nav" aria-label="Main">
          <a href="#board">The board</a>
          <a href="#how">How it works</a>
        </nav>

        <div className="lp-header__actions">
          {signedIn ? (
            <Link href="/dashboard" className="nx-btn nx-btn--primary">
              Open workspace
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="nx-btn nx-btn--ghost lp-header__signin">
                Sign in
              </Link>
              <Link href="/auth/signup" className="nx-btn nx-btn--secondary">
                Create a workspace
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
