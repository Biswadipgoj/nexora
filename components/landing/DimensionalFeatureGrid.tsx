'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TiltCard } from '@/components/ui/motion/TiltCard';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AndroidRoundedIcon from '@mui/icons-material/AndroidRounded';
import WindowRoundedIcon from '@mui/icons-material/WindowRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';

export function DimensionalFeatureGrid() {
  const [platform, setPlatform] = useState<'web' | 'win' | 'android'>('web');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const velocityBars = [42, 68, 55, 92, 78, 105, 118];

  return (
    <section id="features" className="feature-section">
      <div className="feature-header-text">
        <span className="feature-pill-badge">
          Core Capabilities
        </span>
        <h2 className="feature-title">
          Engineered for clarity, momentum, and <span className="text-prismatic">team alignment</span>
        </h2>
        <p className="feature-card-desc" style={{ maxWidth: 640, margin: '0 auto' }}>
          Everything your team needs to organize complex roadmaps, coordinate daily work, and ship on time.
        </p>
      </div>

      <div className="feature-grid-3">
        {/* Card 1: Streamlined Sprint Planning */}
        <TiltCard glowColor="rgba(139, 92, 246, 0.35)">
          <div className="tilt-card-inner">
            <div>
              <div
                className="feature-icon-avatar"
                style={{
                  background: 'linear-gradient(135deg, var(--aurora-iris) 0%, var(--aurora-aqua) 100%)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                }}
              >
                <SpeedRoundedIcon sx={{ fontSize: 28 }} />
              </div>
              <h3 className="feature-card-title">Streamlined Sprint Planning</h3>
              <p className="feature-card-desc">
                Keep deliverables moving with visual drag-and-drop boards, automated status tracking, and clear team ownership.
              </p>
            </div>

            {/* Micro-interactive Velocity Chart */}
            <div className="feature-micro-widget">
              <div className="velocity-chart-header">
                <span>Weekly Team Velocity</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--aurora-aqua)', fontWeight: 700 }}>
                  {hoveredBar !== null ? `${velocityBars[hoveredBar]} pts` : '118 pts (Current)'}
                </span>
              </div>
              <div className="velocity-bars-wrap">
                {velocityBars.map((val, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="velocity-bar-col"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(val / 120) * 100}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.08 }}
                      className={`velocity-bar-fill ${hoveredBar === idx ? 'velocity-bar-fill--active' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Card 2: Cross-Platform Tri-Target */}
        <TiltCard glowColor="rgba(6, 182, 212, 0.35)">
          <div className="tilt-card-inner">
            <div>
              <div
                className="feature-icon-avatar"
                style={{
                  background: 'linear-gradient(135deg, var(--aurora-aqua) 0%, var(--aurora-jade) 100%)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                }}
              >
                <DevicesRoundedIcon sx={{ fontSize: 28 }} />
              </div>
              <h3 className="feature-card-title">Cross-Platform Continuity</h3>
              <p className="feature-card-desc">
                Work seamlessly from anywhere. One unified workspace available on Web, native Windows desktop, and mobile Android.
              </p>
            </div>

            {/* Interactive Platform Switcher */}
            <div className="feature-micro-widget">
              <div className="platform-btn-group">
                <button
                  type="button"
                  onClick={() => setPlatform('web')}
                  className={`platform-btn ${platform === 'web' ? 'platform-btn--active' : ''}`}
                >
                  <LanguageRoundedIcon sx={{ fontSize: 15 }} />
                  <span>Web</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('win')}
                  className={`platform-btn ${platform === 'win' ? 'platform-btn--active' : ''}`}
                >
                  <WindowRoundedIcon sx={{ fontSize: 15 }} />
                  <span>Windows</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('android')}
                  className={`platform-btn ${platform === 'android' ? 'platform-btn--active' : ''}`}
                >
                  <AndroidRoundedIcon sx={{ fontSize: 15 }} />
                  <span>Android</span>
                </button>
              </div>

              <div className="platform-info-row">
                <span>Platform Client:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--aurora-amber)', fontWeight: 600 }}>
                  {platform === 'web' && 'Web App (Real-time Cloud Sync)'}
                  {platform === 'win' && 'Windows Desktop (.exe client)'}
                  {platform === 'android' && 'Mobile Android App'}
                </span>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Card 3: Enterprise Tenancy & Security */}
        <TiltCard glowColor="rgba(244, 63, 94, 0.35)">
          <div className="tilt-card-inner">
            <div>
              <div
                className="feature-icon-avatar"
                style={{
                  background: 'linear-gradient(135deg, var(--aurora-rose) 0%, var(--aurora-amber) 100%)',
                  boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)',
                }}
              >
                <SecurityRoundedIcon sx={{ fontSize: 28 }} />
              </div>
              <h3 className="feature-card-title">Enterprise Data Security</h3>
              <p className="feature-card-desc">
                Granular role-based permissions, encrypted workspace storage, and continuous compliance verification built in.
              </p>
            </div>

            {/* Micro-security Status Display */}
            <div className="feature-micro-widget">
              <div className="security-metrics-list">
                <div className="security-metric-row">
                  <span>Access Control:</span>
                  <span className="security-metric-val" style={{ color: 'var(--aurora-jade)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
                    Multi-Tenant RLS Verified
                  </span>
                </div>
                <div className="security-metric-row">
                  <span>Data Protection:</span>
                  <span className="security-metric-val" style={{ color: 'var(--aurora-jade)' }}>Strict Workspace Isolation</span>
                </div>
                <div className="security-metric-row">
                  <span>Workspace Security:</span>
                  <span className="security-metric-val" style={{ color: 'var(--aurora-aqua)' }}>Encrypted & Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}
