import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

/** Page frame for onboarding and invitations: brand, one column, nothing else. */
export function FlowShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="auth-root">
      <header className="auth-top">
        <Link href="/" aria-label="Nexora home">
          <Logo size="md" />
        </Link>
        {aside}
      </header>
      <main className="flow-shell">{children}</main>
    </div>
  );
}
