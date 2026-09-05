import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { Logo } from '@/components/ui/Logo';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="landing-root">
      {/* Background Glow */}
      <div className="landing-glow" />

      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-header__container">
          <Link href="/" className="landing-brand">
            <Logo size="md" withText animated />
          </Link>

          <div className="landing-header__actions">
            {user ? (
              <Link href="/dashboard" className="btn-hero-primary">
                <span>Go to Workspace</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="btn-hero-primary">
                  <span>Get Started Free</span>
                  <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-pill">
            <span className="hero-pill__badge">New v2.0</span>
            <span className="hero-pill__text">Dual Dark/Light Engine & Instant Zero-Lag Sync</span>
          </div>

          <h1 className="hero-title">
            The high-velocity workspace for <span className="text-gradient">modern product teams</span>
          </h1>

          <p className="hero-subtitle">
            NEXORA combines keyboard-driven speed, interactive Kanban boards, and multi-tenant security into a fluid, state-of-the-art agile workspace.
          </p>

          <div className="hero-cta-group">
            <Link href={user ? '/dashboard' : '/auth/signup'} className="btn-cta-large">
              <span>{user ? 'Open Dashboard' : 'Start Building Free'}</span>
              <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
            </Link>

            <Link href={user ? '/dashboard' : '/auth/login'} className="btn-cta-secondary">
              <span>{user ? 'View Kanban Board' : 'Log into existing account'}</span>
            </Link>
          </div>

          <div className="hero-trust">
            <span>
              <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#10B981', mr: 0.5 }} />
              Zero-lag client state
            </span>
            <span>
              <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#10B981', mr: 0.5 }} />
              Supabase RLS & RBAC
            </span>
            <span>
              <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#10B981', mr: 0.5 }} />
              Full dark/light mode
            </span>
            <span>
              <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#10B981', mr: 0.5 }} />
              Cross-platform Android ready
            </span>
          </div>

          {/* Interactive UI Mockup Preview */}
          <div className="hero-preview glass-panel">
            <div className="preview-topbar">
              <div className="preview-dots">
                <span className="dot dot--red" />
                <span className="dot dot--yellow" />
                <span className="dot dot--green" />
              </div>
              <div className="preview-title">NEXORA Workspace — Product Sprint 1</div>
              <div className="preview-badge">Live Kanban</div>
            </div>

            <div className="preview-board">
              {/* Column 1: To Do */}
              <div className="preview-col">
                <div className="preview-col-header">
                  <span className="dot-status dot-status--todo" />
                  <span className="col-name">To Do</span>
                  <span className="col-num">2</span>
                </div>
                <div className="preview-card">
                  <div className="card-top">
                    <span className="card-key">NEX-101</span>
                    <span className="card-pri card-pri--high">High</span>
                  </div>
                  <div className="card-text">Implement passkeys & enterprise WebAuthn authentication</div>
                  <div className="card-bottom">
                    <span className="card-tag">Security</span>
                    <span className="card-due">Tomorrow</span>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="card-top">
                    <span className="card-key">NEX-102</span>
                    <span className="card-pri card-pri--med">Medium</span>
                  </div>
                  <div className="card-text">Integrate command palette Ctrl+K quick actions</div>
                  <div className="card-bottom">
                    <span className="card-tag">Feature</span>
                    <span className="card-due">In 3 days</span>
                  </div>
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="preview-col">
                <div className="preview-col-header">
                  <span className="dot-status dot-status--prog" />
                  <span className="col-name">In Progress</span>
                  <span className="col-num">1</span>
                </div>
                <div className="preview-card">
                  <div className="card-top">
                    <span className="card-key">NEX-103</span>
                    <span className="card-pri card-pri--urgent">Urgent</span>
                  </div>
                  <div className="card-text">Real-time collaborative drag & drop with optimistic UI</div>
                  <div className="card-bottom">
                    <span className="card-tag">Performance</span>
                    <span className="card-due">Today</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Done */}
              <div className="preview-col">
                <div className="preview-col-header">
                  <span className="dot-status dot-status--done" />
                  <span className="col-name">Done</span>
                  <span className="col-num">2</span>
                </div>
                <div className="preview-card">
                  <div className="card-top">
                    <span className="card-key">NEX-98</span>
                    <span className="card-pri card-pri--low">Low</span>
                  </div>
                  <div className="card-text">Multi-tenant Postgres RLS schema and security policies</div>
                  <div className="card-bottom">
                    <span className="card-tag">Database</span>
                    <span className="card-due" style={{ color: '#10B981' }}>Completed</span>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="card-top">
                    <span className="card-key">NEX-99</span>
                    <span className="card-pri card-pri--med">Medium</span>
                  </div>
                  <div className="card-text">Dual dark and light theme tokens with instant toggle</div>
                  <div className="card-bottom">
                    <span className="card-tag">UI / Design</span>
                    <span className="card-due" style={{ color: '#10B981' }}>Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="features-section">
          <div className="feature-box glass-card">
            <div className="feature-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
              <SpeedRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <h3 className="feature-title">Micro-Second Response</h3>
            <p className="feature-desc">
              Zero query waterfalls. Optimistic local updates guarantee instant visual feedback on every card drag, click, and create.
            </p>
          </div>

          <div className="feature-box glass-card">
            <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
              <DashboardRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <h3 className="feature-title">Command Palette & Shortcuts</h3>
            <p className="feature-desc">
              Navigate seamlessly without touching your mouse. Press <kbd className="kbd-shortcut">Ctrl+K</kbd> to search or <kbd className="kbd-shortcut">C</kbd> to create anywhere.
            </p>
          </div>

          <div className="feature-box glass-card">
            <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <SecurityRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <h3 className="feature-title">Bulletproof Tenant Isolation</h3>
            <p className="feature-desc">
              Hardened PostgreSQL row-level security and strict role-based access control protecting your team&apos;s proprietary data.
            </p>
          </div>

          <div className="feature-box glass-card">
            <div className="feature-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
              <DevicesRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <h3 className="feature-title">Universal Web & Android</h3>
            <p className="feature-desc">
              A single codebase engineered with native Capacitor support for high-performance desktop and mobile touch devices.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__container">
          <div className="footer-left">
            <Logo size="sm" withText animated />
            <span>High-performance project management for agile engineering teams.</span>
          </div>
          <div className="footer-right">
            <Link href="/auth/login">Sign in</Link>
            <Link href="/auth/signup">Create workspace</Link>
            <Link href="/dashboard">Open Dashboard</Link>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-root {
          min-height: 100vh;
          background-color: var(--color-bg);
          color: var(--color-text-primary);
          position: relative;
          overflow-x: hidden;
        }

        .landing-glow {
          position: absolute;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.12) 40%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .landing-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--color-border);
        }

        .landing-header__container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .landing-brand {
          text-decoration: none;
        }

        .landing-header__actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-ghost {
          text-decoration: none;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all var(--transition-fast);
        }

        .btn-ghost:hover {
          color: var(--color-text-primary);
          background: var(--color-surface-hover);
        }

        .btn-hero-primary {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--color-primary-gradient);
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 10px;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all var(--transition-smooth);
        }

        .btn-hero-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .landing-main {
          position: relative;
          z-index: 10;
          max-width: 1280px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 9999px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          font-size: 0.75rem;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
        }

        .hero-pill__badge {
          background: var(--color-primary);
          color: #FFFFFF;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 9999px;
          font-size: 0.6875rem;
        }

        .hero-pill__text {
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 5vw, 4rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.15;
          max-width: 880px;
          margin-bottom: 20px;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--color-text-secondary);
          max-width: 680px;
          line-height: 1.6;
          margin-bottom: 36px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-cta-large {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--color-primary-gradient);
          color: #FFFFFF;
          font-size: 1rem;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
          transition: all var(--transition-smooth);
        }

        .btn-cta-large:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5);
        }

        .btn-cta-secondary {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          font-size: 1rem;
          font-weight: 600;
          padding: 14px 24px;
          border-radius: 12px;
          transition: all var(--transition-fast);
        }

        .btn-cta-secondary:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-border-strong);
        }

        .hero-trust {
          display: flex;
          align-items: center;
          gap: 24px;
          font-size: 0.8125rem;
          color: var(--color-text-tertiary);
          margin-bottom: 50px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Hero Preview Mockup */
        .hero-preview {
          width: 100%;
          max-width: 1080px;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-border);
          text-align: left;
        }

        .preview-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: var(--color-bg-subtle);
          border-bottom: 1px solid var(--color-border);
        }

        .preview-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot--red { background: #EF4444; }
        .dot--yellow { background: #F59E0B; }
        .dot--green { background: #10B981; }

        .preview-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .preview-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--color-done);
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .preview-board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 20px;
          background: var(--color-surface);
        }

        .preview-col {
          background: var(--color-bg-subtle);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .preview-col-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-text-primary);
          text-transform: uppercase;
        }

        .dot-status {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .dot-status--todo { background: #6366F1; }
        .dot-status--prog { background: #8B5CF6; }
        .dot-status--done { background: #10B981; }

        .col-num {
          margin-left: auto;
          font-family: var(--font-mono);
          color: var(--color-text-tertiary);
          font-size: 0.6875rem;
        }

        .preview-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-key {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--color-text-tertiary);
          font-weight: 600;
        }

        .card-pri {
          font-size: 0.625rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .card-pri--urgent { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
        .card-pri--high { background: rgba(249, 115, 22, 0.15); color: #F97316; }
        .card-pri--med { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
        .card-pri--low { background: rgba(14, 165, 233, 0.15); color: #0EA5E9; }

        .card-text {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text-primary);
          line-height: 1.35;
        }

        .card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 4px;
          border-top: 1px solid var(--color-border-subtle);
          font-size: 0.6875rem;
        }

        .card-tag {
          color: var(--color-text-secondary);
        }

        .card-due {
          color: var(--color-text-tertiary);
          font-weight: 500;
        }

        /* Features Section */
        .features-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-top: 70px;
        }

        .feature-box {
          padding: 24px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .feature-desc {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        /* Footer */
        .landing-footer {
          border-top: 1px solid var(--color-border);
          padding: 40px 24px;
          background: var(--color-bg-subtle);
        }

        .landing-footer__container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .footer-right a {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .footer-right a:hover {
          color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .preview-board {
            grid-template-columns: 1fr;
          }
          .hero-preview {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
