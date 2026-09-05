import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { LivingAuroraCanvas } from '@/components/ui/motion/LivingAuroraCanvas';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroLiveSandbox } from '@/components/landing/HeroLiveSandbox';
import { DimensionalFeatureGrid } from '@/components/landing/DimensionalFeatureGrid';
import { DemoWorkspaceButton } from '@/components/landing/DemoWorkspaceButton';
import { CreatorBadge } from '@/components/ui/CreatorBadge';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

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

      {/* Main Hero Stage */}
      <main className="landing-hero-stage">
        {/* Floating Live Badges */}
        <div className="hero-floating-badge hero-floating-badge--left">
          <span style={{ color: '#059669', fontSize: '1rem' }}>⚡</span>
          <span>2.4x Faster Sprint Delivery</span>
        </div>
        <div className="hero-floating-badge hero-floating-badge--right">
          <span style={{ color: '#2563eb', fontSize: '1rem' }}>✓</span>
          <span>99.4% On-Time Completion</span>
        </div>

        {/* Release Pill Badge (No duplicate NEXORA) */}
        <div className="hero-pill-badge">
          <span className="hero-beacon" />
          <span>NEW RELEASE</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--aurora-iris)', fontWeight: 600 }}>
            Modern Workspace for Productive Teams
          </span>
        </div>

        {/* Hero Title with Shimmering Gradient */}
        <h1 className="hero-main-title">
          Where high-performing teams plan, track, and{' '}
          <span className="text-prismatic">deliver great work</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          From daily task lists to company-wide roadmaps, NEXORA brings your team's projects into one clear, focused, and intuitive workspace.
        </p>

        {/* Hero Action Buttons */}
        <div className="hero-cta-group">
          <Link
            href={user ? '/dashboard' : '/auth/signup'}
            className="btn-hero-cta btn-hero-cta--primary"
          >
            <span>{user ? 'Open Workspace' : 'Start Free Workspace'}</span>
            <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          </Link>

          <DemoWorkspaceButton />
        </div>

        {/* Trust Badges */}
        <div className="hero-trust-bar">
          <span className="hero-trust-item">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            Real-time team collaboration
          </span>
          <span className="hero-trust-item">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            Customizable team workflows
          </span>
          <span className="hero-trust-item">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            Enterprise privacy & security
          </span>
          <span className="hero-trust-item">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            Web • Windows • Android
          </span>
        </div>

        {/* Live Interactive Kanban Sandbox */}
        <section id="sandbox" style={{ marginTop: 48, textAlign: 'left' }}>
          <HeroLiveSandbox />
        </section>

        {/* Dimensional Feature Grid */}
        <DimensionalFeatureGrid />

        {/* Bottom CTA Banner */}
        <div className="landing-cta-banner">
          <div className="cta-banner-glow" />
          <div className="cta-banner-inner">
            <div className="cta-banner-icon">
              <BoltRoundedIcon sx={{ fontSize: 32 }} />
            </div>
            <h3 className="cta-banner-title">
              Ready to elevate how your team works?
            </h3>
            <p className="cta-banner-desc">
              Join thousands of forward-thinking teams shipping higher-impact deliverables on schedule with NEXORA.
            </p>
            <div className="cta-banner-actions">
              <Link
                href={user ? '/dashboard' : '/auth/signup'}
                className="btn-landing-primary"
                style={{ padding: '12px 28px', fontSize: '0.9375rem' }}
              >
                <span>{user ? 'Enter Dashboard' : 'Get Started Free'}</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <span>© 2026 NEXORA. All rights reserved.</span>

          {/* Unique Creator Signature with Playful Burst Animation */}
          <div className="landing-footer-creator">
            <CreatorBadge size="md" />
          </div>

          <div className="landing-footer-links">
            <Link href="/auth/login" className="landing-footer-link">
              Sign In
            </Link>
            <Link href="/dashboard" className="landing-footer-link">
              Demo
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
