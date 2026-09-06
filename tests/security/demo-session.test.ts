import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Regression guard for the demo-session auth trap.
 *
 * A single click on "Explore the demo workspace" set a seven-day cookie, and
 * the session layer then redirected every /auth/* request to /dashboard. That
 * made signing in unreachable from the UI: the only escape was an undocumented
 * ?logout=true parameter.
 *
 * Section 3.5 treats unexpected navigation as an unresolved defect, and section
 * 10 requires every route to produce a useful recovery path.
 */
const source = fs.readFileSync(
  path.resolve(process.cwd(), 'lib/supabase/middleware.ts'),
  'utf-8'
);

describe('Demo session must never block authentication', () => {
  it('does not redirect auth routes away when a demo cookie is present', () => {
    // The demo short-circuit has to exclude auth routes, or the trap returns.
    expect(source).toMatch(/isDemo\s*&&\s*!isAuthRoute/);

    // No unconditional "demo means bounce off the auth pages" rule.
    expect(source).not.toMatch(/if\s*\(\s*isDemo\s*&&\s*AUTH_ROUTES\.some[\s\S]{0,200}?NextResponse\.redirect/);
  });

  it('lets a real session supersede a leftover demo cookie', () => {
    // A stale demo cookie must not decide which workspace a signed-in user sees.
    expect(source).toContain('hasSupabaseSession');
    expect(source).toMatch(/user\s*&&\s*isDemo/);
  });

  it('clears the demo cookie with the scope it was set with', () => {
    expect(source).toContain('DEMO_COOKIE');
    expect(source).toMatch(/path:\s*'\/'/);
    // Cleared, not merely overwritten with a falsy value.
    expect(source).toMatch(/maxAge:\s*0/);
  });

  it('keeps the demo workspace reachable for visitors without a real session', () => {
    expect(source).toMatch(/!user\s*&&\s*isDemo\s*&&\s*!isPublicRoute/);
  });

  it('still supports an explicit demo exit', () => {
    expect(source).toContain("searchParams.get('logout')");
  });
});
