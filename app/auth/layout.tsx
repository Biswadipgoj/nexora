import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Sign In — NEXORA',
  description: 'Sign in to your NEXORA workspace. Enterprise-grade work management.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <div className="auth-layout__brand-bg" />
        <div className="auth-layout__brand-content">
          <div className="auth-layout__logo animate-slide-in">
            <Image 
              src="/logo.jpg" 
              alt="NEXORA Logo" 
              width={52} 
              height={52} 
              className="auth-layout__logo-img" 
              priority
            />
            <span className="auth-layout__logo-text">NEXORA</span>
          </div>
          <h1 className="auth-layout__tagline animate-slide-in stagger-1">
            Enterprise-grade<br />
            <span className="auth-layout__tagline-accent">work management.</span>
          </h1>
          <p className="auth-layout__description animate-slide-in stagger-2">
            The power of Jira without the complexity.
            One unified engine for professional work and personal productivity.
          </p>
          <div className="auth-layout__features animate-slide-in stagger-3">
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <strong>SOC 2 Type II</strong>
                <span>Audited security controls</span>
              </div>
            </div>
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div>
                <strong>End-to-end encryption</strong>
                <span>AES-256 at rest, TLS 1.3 in transit</span>
              </div>
            </div>
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <strong>99.9% uptime SLA</strong>
                <span>Multi-region, auto-failover</span>
              </div>
            </div>
          </div>
          <div className="auth-layout__trust animate-slide-in stagger-4">
            <span className="auth-layout__trust-label">Trusted by teams at</span>
            <div className="auth-layout__trust-logos">
              <span>Enterprise</span>
              <span>•</span>
              <span>Startup</span>
              <span>•</span>
              <span>Agency</span>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-layout__form-container">
        <div className="auth-layout__form-wrapper animate-slide-in">
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
          background: #080A18;
          overflow: hidden;
        }

        .auth-layout__brand-bg {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.08), transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.06), transparent 50%);
          z-index: 0;
        }

        .auth-layout__brand-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: var(--space-16) var(--space-12);
          height: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .auth-layout__logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-12);
        }

        .auth-layout__logo-img {
          border-radius: 12px;
          object-fit: cover;
        }

        .auth-layout__logo-text {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.12em;
        }

        .auth-layout__tagline {
          font-size: 2.75rem;
          font-weight: 800;
          color: white;
          line-height: 1.15;
          margin-bottom: var(--space-6);
          letter-spacing: -0.03em;
        }

        .auth-layout__tagline-accent {
          background: linear-gradient(135deg, #3B82F6, #818CF8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-layout__description {
          font-size: var(--font-size-base);
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.7;
          margin-bottom: var(--space-10);
          max-width: 440px;
        }

        .auth-layout__features {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          margin-bottom: var(--space-10);
        }

        .auth-layout__feature {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          color: white;
        }

        .auth-layout__feature-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: var(--radius-md);
          flex-shrink: 0;
          color: #60A5FA;
        }

        .auth-layout__feature strong {
          display: block;
          font-weight: 600;
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1px;
        }

        .auth-layout__feature span {
          font-size: var(--font-size-xs);
          color: rgba(255, 255, 255, 0.4);
        }

        .auth-layout__trust {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: var(--space-6);
        }

        .auth-layout__trust-label {
          font-size: var(--font-size-xs);
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          display: block;
          margin-bottom: var(--space-3);
        }

        .auth-layout__trust-logos {
          display: flex;
          gap: var(--space-3);
          color: rgba(255, 255, 255, 0.2);
          font-size: var(--font-size-sm);
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        .auth-layout__form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          background: var(--color-bg);
        }

        .auth-layout__form-wrapper {
          width: 100%;
          max-width: 440px;
        }

        /* Enterprise animations — subtle, professional */
        @keyframes slide-in {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-in {
          opacity: 0;
          animation: slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .stagger-1 { animation-delay: 100ms; }
        .stagger-2 { animation-delay: 200ms; }
        .stagger-3 { animation-delay: 300ms; }
        .stagger-4 { animation-delay: 400ms; }

        @media (min-width: 1024px) {
          .auth-layout__brand {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
