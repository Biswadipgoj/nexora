import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroLiveSandbox } from '@/components/landing/HeroLiveSandbox';
import { DimensionalFeatureGrid } from '@/components/landing/DimensionalFeatureGrid';
import { DemoWorkspaceButton } from '@/components/landing/DemoWorkspaceButton';
import { PriorityMark } from '@/components/ui/Marks';
import '@/components/landing/landing.css';

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  return (
    <div className="lp">
      <LandingHeader signedIn={signedIn} />

      <main>
        {/* One promise, one primary action, one demo action, and one proof
            row of shipped capabilities — no invented numbers. */}
        <section className="lp-wrap lp-hero">
          <p className="nx-eyebrow">Projects and tasks for small teams</p>
          <h1 className="lp-hero__title">
            Plan the work, watch it <em>move</em>, finish it together.
          </h1>
          <p className="lp-hero__lede">
            Nexora keeps a team&apos;s projects, tasks and daily priorities on one board — quick to scan, quick to
            update, and clear about what changed.
          </p>

          <div className="lp-hero__actions">
            <Link
              href={signedIn ? '/dashboard' : '/auth/signup'}
              className="nx-btn nx-btn--primary nx-btn--lg btn-hero-cta btn-hero-cta--primary"
            >
              {signedIn ? 'Open your workspace' : 'Create a workspace'}
              <span aria-hidden="true">→</span>
            </Link>
            <DemoWorkspaceButton />
          </div>

          <ul className="lp-proof">
            <li>Board, inbox and personal task views</li>
            <li>Keyboard-first, with a command palette</li>
            <li>Web, Windows and Android</li>
          </ul>

          <aside className="lp-pin" aria-hidden="true">
            <div className="lp-pin__top">
              <span className="nx-key">APP-91</span>
              <PriorityMark priority={4} />
            </div>
            <p className="lp-pin__title">Fix the login loop on an expired refresh token</p>
            <div className="lp-pin__meta">
              <span>Bug</span>
              <span>Alex Morgan</span>
            </div>
            <span className="lp-pin__stamp">Done</span>
          </aside>
        </section>

        <section id="board" className="lp-wrap lp-board" aria-label="Try the board">
          <HeroLiveSandbox />
        </section>

        <div className="lp-wrap">
          <DimensionalFeatureGrid />

          <section className="lp-close" aria-labelledby="close-title">
            <div>
              <h2 id="close-title" className="lp-h2">
                Start with one project.
              </h2>
              <p>Create a workspace, add a first board, and invite the people who need it. It takes about a minute.</p>
            </div>
            <Link href={signedIn ? '/dashboard' : '/auth/signup'} className="nx-btn nx-btn--secondary nx-btn--lg">
              {signedIn ? 'Open your workspace' : 'Create a workspace'}
            </Link>
          </section>

          <footer className="lp-footer">
            <span>© {new Date().getFullYear()} Nexora</span>
            <span>
              Made by{' '}
              <a href="https://biswadip.in" target="_blank" rel="noreferrer">
                Biswadip Goj
              </a>
            </span>
            <nav aria-label="Footer">
              <Link href="/auth/login">Sign in</Link>
              <DemoWorkspaceButton className="" label="Demo workspace" />
              <a href="https://github.com/Biswadipgoj/nexora" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </nav>
          </footer>
        </div>
      </main>
    </div>
  );
}
