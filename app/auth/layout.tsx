import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — NEXORA',
  description: 'Sign in to your NEXORA workspace. Work. Plan. Build. Live.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <div className="auth-layout__brand-content">
          <div className="auth-layout__logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="48" height="48" rx="12" fill="var(--color-accent)" />
              <path d="M14 34V14L24 28L34 14V34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="auth-layout__logo-text">NEXORA</span>
          </div>
          <h1 className="auth-layout__tagline">
            Work. Plan. Build. Live.
          </h1>
          <p className="auth-layout__description">
            One engine for professional work and personal productivity.
            Jira&apos;s power without the complexity.
          </p>
          <div className="auth-layout__features">
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">✦</div>
              <div>
                <strong>Simple by default</strong>
                <span>Productive within minutes, no learning curve</span>
              </div>
            </div>
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">⚡</div>
              <div>
                <strong>Blazingly fast</strong>
                <span>Sub-second interactions, always</span>
              </div>
            </div>
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">🔒</div>
              <div>
                <strong>Secure by design</strong>
                <span>Enterprise-grade security from day one</span>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-layout__brand-bg" />
      </div>
      <div className="auth-layout__form-container">
        <div className="auth-layout__form-wrapper">
          {children}
        </div>
      </div>
      <style>{`
        .auth-layout {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg);
        }

        .auth-layout__brand {
          display: none;
          position: relative;
          flex: 1;
          background: linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-700) 50%, var(--color-primary-500) 100%);
          overflow: hidden;
        }

        .auth-layout__brand-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%);
        }

        .auth-layout__brand-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: var(--space-16);
          height: 100%;
          max-width: 560px;
        }

        .auth-layout__logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-10);
        }

        .auth-layout__logo-text {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: white;
          letter-spacing: 0.1em;
        }

        .auth-layout__tagline {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: white;
          line-height: var(--line-height-heading);
          margin-bottom: var(--space-4);
          letter-spacing: var(--letter-spacing-tight);
        }

        .auth-layout__description {
          font-size: var(--font-size-lg);
          color: rgba(255, 255, 255, 0.8);
          line-height: var(--line-height-body);
          margin-bottom: var(--space-12);
        }

        .auth-layout__features {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .auth-layout__feature {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          color: white;
        }

        .auth-layout__feature-icon {
          font-size: var(--font-size-lg);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .auth-layout__feature strong {
          display: block;
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-base);
          margin-bottom: var(--space-1);
        }

        .auth-layout__feature span {
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.7);
        }

        .auth-layout__form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
        }

        .auth-layout__form-wrapper {
          width: 100%;
          max-width: 420px;
        }

        @media (min-width: 1024px) {
          .auth-layout__brand {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
