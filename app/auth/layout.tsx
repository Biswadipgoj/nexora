import type { Metadata } from 'next';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Sign In — NEXORA',
  description: 'Sign in to your NEXORA workspace.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-root">
      {/* Product Showcase Panel (Desktop) */}
      <div className="auth-showcase">
        <div className="auth-showcase__content">
          <div className="auth-brand-badge" style={{ display: 'flex', justifyContent: 'center' }}>
            <Logo size="lg" animated withText />
          </div>

          <div className="auth-hero-copy">
            <h1 className="auth-hero-title">
              Plan, track, and ship <span className="auth-title-gradient">together</span>.
            </h1>
            <p className="auth-hero-desc">
              A clean board for teams to organize tasks and see progress at a glance.
            </p>
          </div>

          {/* Real Live Board Preview */}
          <div className="auth-board-preview">
            <div className="auth-preview-header">
              <div className="auth-preview-project">
                <span className="auth-preview-dot" />
                <span className="auth-preview-name">Mobile App</span>
                <span className="auth-preview-tag">APP</span>
              </div>
              <div className="auth-preview-badges">
                <span className="auth-preview-pill auth-preview-pill--active">Active sprint</span>
                <span className="auth-preview-pill">3 members</span>
              </div>
            </div>

            <div className="auth-preview-columns">
              <div className="auth-preview-col">
                <div className="auth-preview-col-title">
                  <span className="auth-col-dot auth-col-dot--progress" />
                  <span>In Progress</span>
                  <span className="auth-col-num">2</span>
                </div>
                <div className="auth-preview-card">
                  <div className="auth-card-top">
                    <span className="auth-card-key">APP-104</span>
                    <span className="auth-card-priority auth-card-priority--high">High</span>
                  </div>
                  <p className="auth-card-title">Stripe checkout integration</p>
                  <span className="auth-card-due">Due Friday</span>
                </div>
                <div className="auth-preview-card">
                  <div className="auth-card-top">
                    <span className="auth-card-key">APP-98</span>
                    <span className="auth-card-priority auth-card-priority--medium">Medium</span>
                  </div>
                  <p className="auth-card-title">Profile photo upload</p>
                  <span className="auth-card-due">Due tomorrow</span>
                </div>
              </div>

              <div className="auth-preview-col">
                <div className="auth-preview-col-title">
                  <span className="auth-col-dot auth-col-dot--done" />
                  <span>Done</span>
                  <span className="auth-col-num">3</span>
                </div>
                <div className="auth-preview-card">
                  <div className="auth-card-top">
                    <span className="auth-card-key">APP-91</span>
                    <span className="auth-card-priority auth-card-priority--urgent">Urgent</span>
                  </div>
                  <p className="auth-card-title">Fix login redirect loop</p>
                  <span className="auth-card-status">Completed</span>
                </div>
              </div>
            </div>

            <div className="auth-preview-shortcuts">
              <span>Press <kbd>C</kbd> to add task</span>
              <span>Press <kbd>⌘K</kbd> to search</span>
            </div>
          </div>

          <div className="auth-showcase__footer">
            <span className="auth-version-note">
              ✨ Click <strong>Try via Mock Login</strong> to open this exact live board
            </span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="auth-form-pane">
        <div className="auth-form-card">
          {children}
        </div>
      </div>

      <style>{`
        .auth-root {
          display: flex;
          min-height: 100vh;
          background: radial-gradient(at 8% 12%, rgba(99, 102, 241, 0.16) 0px, transparent 45%),
                      radial-gradient(at 92% 16%, rgba(236, 72, 153, 0.14) 0px, transparent 45%),
                      radial-gradient(at 50% 90%, rgba(14, 165, 233, 0.14) 0px, transparent 50%),
                      #F8FAFC;
        }

        /* Showcase Panel */
        .auth-showcase {
          display: none;
          flex: 1.2;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(99, 102, 241, 0.15);
        }

        .auth-showcase__content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 50px 56px;
          height: 100%;
          max-width: 620px;
        }

        .auth-brand-badge {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-logo-ring {
          padding: 2.5px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
          display: inline-flex;
        }

        .auth-logo-img {
          border-radius: 8px;
          object-fit: cover;
          display: block;
          background: #FFFFFF;
        }

        .auth-brand-name {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #0F172A;
        }

        .auth-hero-copy {
          margin: 32px 0 24px;
        }

        .auth-hero-title {
          font-family: var(--font-display);
          font-size: 2.125rem;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.02em;
          color: #0F172A;
          margin-bottom: 12px;
        }

        .auth-title-gradient {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }

        .auth-hero-desc {
          font-size: 0.9375rem;
          color: #475467;
          line-height: 1.6;
        }

        /* Board Preview Mockup */
        .auth-board-preview {
          background: #FFFFFF;
          border: 1px solid rgba(99, 102, 241, 0.18);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 16px 32px -8px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.9) inset;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .auth-preview-project {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-preview-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .auth-preview-name {
          font-weight: 700;
          font-size: 0.875rem;
          color: #0F172A;
        }

        .auth-preview-tag {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          background: #EEF2FF;
          color: #4F46E5;
          padding: 1.5px 6px;
          border-radius: 4px;
        }

        .auth-preview-badges {
          display: flex;
          gap: 6px;
        }

        .auth-preview-pill {
          font-size: 0.6875rem;
          padding: 2px 8px;
          border-radius: 9999px;
          background: #F1F5F9;
          color: #64748B;
          font-weight: 500;
        }

        .auth-preview-pill--active {
          background: #ECFDF5;
          color: #059669;
          font-weight: 600;
        }

        .auth-preview-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .auth-preview-col {
          background: #F8FAFC;
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid #F1F5F9;
        }

        .auth-preview-col-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1E293B;
        }

        .auth-col-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .auth-col-dot--progress { background: #8B5CF6; }
        .auth-col-dot--done { background: #10B981; }

        .auth-col-num {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #64748B;
          margin-left: auto;
        }

        .auth-preview-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .auth-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .auth-card-key {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #64748B;
        }

        .auth-card-priority {
          font-size: 0.625rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .auth-card-priority--high {
          background: #FFF7ED;
          color: #EA580C;
        }

        .auth-card-priority--medium {
          background: #FFFBEB;
          color: #D97706;
        }

        .auth-card-priority--urgent {
          background: #FEF2F2;
          color: #DC2626;
        }

        .auth-card-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0F172A;
          line-height: 1.35;
          margin: 2px 0 0;
        }

        .auth-card-due,
        .auth-card-status {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .auth-card-status {
          color: #10B981;
          font-weight: 600;
        }

        .auth-preview-shortcuts {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
          font-size: 0.6875rem;
          color: #64748B;
        }

        .auth-preview-shortcuts kbd {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 4px;
          padding: 1px 5px;
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #334155;
        }

        .auth-showcase__footer {
          margin-top: 24px;
        }

        .auth-version-note {
          font-size: 0.75rem;
          color: #64748B;
        }

        /* Form Side */
        .auth-form-pane {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .auth-form-card {
          width: 100%;
          max-width: 420px;
        }

        @media (min-width: 1024px) {
          .auth-showcase {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
