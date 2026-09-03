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
        <div className="auth-layout__brand-bg" />
        <div className="auth-layout__brand-glow" />
        <div className="auth-layout__brand-content">
          <div className="auth-layout__logo animate-fade-in-up">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="auth-layout__logo-svg">
              <rect width="48" height="48" rx="12" fill="url(#paint0_linear)" />
              <path d="M14 34V14L24 28L34 14V34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#818CF8" />
                  <stop offset="1" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
            <span className="auth-layout__logo-text">NEXORA</span>
          </div>
          <h1 className="auth-layout__tagline animate-fade-in-up stagger-1">
            Work. Plan. <span className="gradient-text">Build.</span> Live.
          </h1>
          <p className="auth-layout__description animate-fade-in-up stagger-2">
            One engine for professional work and personal productivity.
            Jira&apos;s power without the complexity.
          </p>
          <div className="auth-layout__features animate-fade-in-up stagger-3">
            <div className="auth-layout__feature hover-lift glass-feature">
              <div className="auth-layout__feature-icon">✦</div>
              <div>
                <strong>Simple by default</strong>
                <span>Productive within minutes, no learning curve</span>
              </div>
            </div>
            <div className="auth-layout__feature hover-lift glass-feature">
              <div className="auth-layout__feature-icon">⚡</div>
              <div>
                <strong>Blazingly fast</strong>
                <span>Sub-second interactions, always</span>
              </div>
            </div>
            <div className="auth-layout__feature hover-lift glass-feature">
              <div className="auth-layout__feature-icon">🔒</div>
              <div>
                <strong>Secure by design</strong>
                <span>Enterprise-grade security from day one</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-layout__form-container">
        <div className="auth-layout__form-wrapper animate-fade-in-up">
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
          background: #0F1117;
          overflow: hidden;
        }

        .auth-layout__brand-bg {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(129, 140, 248, 0.15), transparent 25%);
          z-index: 0;
        }

        .auth-layout__brand-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(0,0,0,0) 70%);
          top: -100px;
          right: -100px;
          border-radius: 50%;
          filter: blur(60px);
          z-index: 0;
          animation: pulse-glow 8s ease-in-out infinite alternate;
        }

        .auth-layout__brand-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: var(--space-16);
          height: 100%;
          max-width: 640px;
          margin: 0 auto;
        }

        .auth-layout__logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-10);
        }
        
        .auth-layout__logo-svg {
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          border-radius: 12px;
        }

        .auth-layout__logo-text {
          font-size: var(--font-size-xl);
          font-weight: 800;
          color: white;
          letter-spacing: 0.15em;
        }

        .auth-layout__tagline {
          font-size: 3.5rem;
          font-weight: 800;
          color: white;
          line-height: 1.1;
          margin-bottom: var(--space-6);
          letter-spacing: var(--letter-spacing-tight);
        }

        .auth-layout__description {
          font-size: var(--font-size-lg);
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: var(--space-12);
          max-width: 480px;
        }

        .auth-layout__features {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-width: 440px;
        }

        .glass-feature {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        .glass-feature:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }

        .auth-layout__feature {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          color: white;
        }

        .auth-layout__feature-icon {
          font-size: var(--font-size-lg);
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .auth-layout__feature strong {
          display: block;
          font-weight: 600;
          font-size: var(--font-size-base);
          margin-bottom: 2px;
          color: #F1F3F9;
        }

        .auth-layout__feature span {
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          display: block;
        }

        .auth-layout__form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          background: var(--color-bg);
          position: relative;
        }

        .auth-layout__form-wrapper {
          width: 100%;
          max-width: 440px;
          z-index: 2;
        }

        /* --- UI/UX ANIMATION UTILITIES --- */
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-glow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.1); opacity: 0.8; }
        }

        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .stagger-1 { animation-delay: 150ms; }
        .stagger-2 { animation-delay: 300ms; }
        .stagger-3 { animation-delay: 450ms; }

        .hover-lift {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .hover-lift:hover {
          transform: translateY(-4px);
        }

        .gradient-text {
          background: linear-gradient(135deg, #818CF8, #C7D2FE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
