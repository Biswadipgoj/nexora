import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { LivingAuroraCanvas } from '@/components/ui/motion/LivingAuroraCanvas';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroLiveSandbox } from '@/components/landing/HeroLiveSandbox';
import { DimensionalFeatureGrid } from '@/components/landing/DimensionalFeatureGrid';
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
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--canvas-bg)] text-[var(--text-main)] selection:bg-[var(--aurora-iris)] selection:text-white">
      {/* Dynamic Ambient Living Aurora Orbs */}
      <LivingAuroraCanvas />

      {/* Suspended Frosted Header */}
      <LandingHeader user={user} />

      {/* Main Hero Stage */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-24 text-center sm:pt-20">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--aurora-iris)]/30 bg-[var(--surface-primary)] px-4 py-1.5 text-xs font-semibold shadow-[0_0_20px_rgba(139,92,246,0.25)] backdrop-blur-xl">
          <span className="flex h-2 w-2 rounded-full bg-[var(--aurora-aqua)] animate-pulse" />
          <span className="text-[var(--text-main)]">NEXORA 2.0</span>
          <span className="text-[var(--text-muted)]">•</span>
          <span className="text-[var(--aurora-iris)] font-mono">Prismatic Aurora Engine</span>
        </div>

        {/* Hero Title with Shimmering Gradient */}
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-tight">
          The agile workspace engineered for{' '}
          <span className="text-prismatic">pure velocity & tactile depth</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--text-muted)] sm:text-lg leading-relaxed">
          Break free from sterile monochrome and flat layouts. NEXORA combines fluid 120fps spring physics,
          frosted dimensional glass, and multi-tenant security across Web, Windows, and Android.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={user ? '/dashboard' : '/auth/signup'}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[var(--aurora-iris)] via-[#9333ea] to-[var(--aurora-aqua)] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <span>{user ? 'Open Workspace' : 'Start Building Free'}</span>
            <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[var(--surface-elevated)] px-6 py-3.5 text-sm font-semibold text-[var(--text-main)] shadow-[var(--shadow-sm)] backdrop-blur-xl transition-all hover:border-white/30 hover:bg-[var(--surface-hover)] active:scale-95"
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: 'var(--aurora-amber)' }} />
            <span>Explore Demo Workspace</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            Zero-lag optimistic updates
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            100% Supabase RLS coverage
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            Non-flat dimensional glass
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'var(--aurora-jade)' }} />
            Web • Windows • Android
          </span>
        </div>

        {/* Live Interactive Kanban Sandbox */}
        <section id="sandbox" className="mt-12 text-left">
          <HeroLiveSandbox />
        </section>

        {/* Dimensional Feature Grid */}
        <DimensionalFeatureGrid />

        {/* Bottom CTA Banner */}
        <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-primary)] p-10 shadow-[var(--shadow-lg)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--aurora-iris)]/20 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--aurora-iris)]/20 text-[var(--aurora-iris)] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <BoltRoundedIcon sx={{ fontSize: 30 }} />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              Ready to feel the difference?
            </h3>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
              Jump directly into your workspace with zero configuration, instant zero-lag syncing, and a responsive experience that inspires you to create.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href={user ? '/dashboard' : '/auth/signup'}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--aurora-iris)] to-[var(--aurora-aqua)] px-7 py-3 text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-transform hover:scale-105 active:scale-95"
              >
                <span>{user ? 'Enter Dashboard' : 'Create Free Account'}</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 pt-8 text-xs text-[var(--text-subtle)] flex flex-wrap items-center justify-between gap-4">
          <span>© 2026 NEXORA. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Demo
            </Link>
            <a href="https://github.com/Biswadipgoj/nexora" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
