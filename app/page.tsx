import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { LivingAuroraCanvas } from '@/components/ui/motion/LivingAuroraCanvas';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroLiveSandbox } from '@/components/landing/HeroLiveSandbox';
import { DimensionalFeatureGrid } from '@/components/landing/DimensionalFeatureGrid';
import { DemoWorkspaceButton } from '@/components/landing/DemoWorkspaceButton';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="landing-page-root">
      {/* Dynamic Ambient Living Aurora Orbs */}
      <LivingAuroraCanvas />

      {/* Suspended Frosted Header */}
      <LandingHeader user={user} />

      {/* Main Hero Stage

          Section 6.1: "Simplify the hero to one primary promise, one primary
          CTA, and one secondary demo action. Retain one proof row below the
          CTA, but remove unsupported numerical claims such as delivery
          multipliers or completion percentages unless they are backed by a
          visible source and real product data."

          The floating "2.4x Faster Sprint Delivery" and "99.4% On-Time
          Completion" badges, the NEW RELEASE pill and the four-item trust bar
          were removed: the numbers were invented, and the competing badges are
          what made the page read as generated rather than built. Everything
          stated below is verifiable from the product itself. */}
      <main className="landing-hero-stage">
        <h1 className="hero-main-title">
          Plan the work, watch it move, <span className="text-prismatic">finish it together</span>
        </h1>

        <p className="hero-subtitle">
          Nexora keeps a team&apos;s projects, tasks and daily priorities on one board — fast to scan, quick to
          update, and clear about what changed.
        </p>

        <div className="hero-cta-group">
          <Link href={user ? '/dashboard' : '/auth/signup'} className="btn-hero-cta btn-hero-cta--primary">
            <span>{user ? 'Open workspace' : 'Create a workspace'}</span>
            <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          </Link>

          <DemoWorkspaceButton />
        </div>

        {/* One proof row. Each item is a shipped capability, not a claim. */}
        <div className="hero-trust-bar">
          <span className="hero-trust-item">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-green)' }} />
            Board, inbox and personal task views
          </span>
          <span className="hero-trust-item">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-green)' }} />
            Keyboard-first, with a command palette
          </span>
          <span className="hero-trust-item">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--nx-green)' }} />
            Web, Windows and Android
          </span>
        </div>

        {/* Live Interactive Kanban Sandbox */}
        <section id="sandbox" style={{ marginTop: 48, textAlign: 'left' }}>
          <HeroLiveSandbox />
        </section>

        {/* Dimensional Feature Grid */}
        <DimensionalFeatureGrid />

        {/* Closing CTA. Section 6.1: "The final CTA should be shorter and
            quieter than the hero." The glow, the icon medallion and the
            "join thousands of forward-thinking teams" claim are gone — the
            first was decoration, the second unsupported. */}
        <div className="landing-cta-banner">
          <div className="cta-banner-inner">
            <h2 className="cta-banner-title">Start with one project</h2>
            <p className="cta-banner-desc">
              Create a workspace, add your first board, and invite the people who need it.
            </p>
            <div className="cta-banner-actions">
              <Link href={user ? '/dashboard' : '/auth/signup'} className="btn-landing-primary">
                <span>{user ? 'Open workspace' : 'Create a workspace'}</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <span>© {new Date().getFullYear()} Nexora</span>

          <div className="landing-footer-links">
            <Link href="/auth/login" className="landing-footer-link">
              Sign in
            </Link>
            <Link href="/dashboard" className="landing-footer-link">
              Demo workspace
            </Link>
            <a
              href="https://github.com/Biswadipgoj/nexora"
              target="_blank"
              rel="noreferrer"
              className="landing-footer-link"
            >
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
