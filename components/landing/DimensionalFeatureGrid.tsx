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
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-20">
      <div className="text-center mb-14">
        <span className="inline-block rounded-full border border-[var(--aurora-iris)]/40 bg-[var(--aurora-iris)]/10 px-4 py-1 text-xs font-semibold text-[var(--aurora-iris)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          Architectural Mastery
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
          Built for speed, depth, and <span className="text-prismatic">zero compromise</span>
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-base text-[var(--text-muted)]">
          Every surface is engineered with anti-flat tactile depth, 120fps spring physics, and row-level enterprise security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1: High-Velocity Sprint Engine */}
        <TiltCard glowColor="rgba(139, 92, 246, 0.35)" className="flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--aurora-iris)] to-[var(--aurora-aqua)] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <SpeedRoundedIcon sx={{ fontSize: 28 }} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">High-Velocity Engine</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
              Zero network waterfalls. Optimistic state transitions provide instant 0ms tactile feedback on every task move.
            </p>
          </div>

          {/* Micro-interactive Velocity Chart */}
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-3">
              <span>Sprint Velocity</span>
              <span className="font-mono text-[var(--aurora-aqua)] font-bold">
                {hoveredBar !== null ? `${velocityBars[hoveredBar]} SP` : '118 SP (Peak)'}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-20">
              {velocityBars.map((val, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="group relative flex-1 flex flex-col justify-end items-center h-full cursor-pointer"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / 120) * 100}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.08 }}
                    className={`w-full rounded-t-md transition-all duration-200 ${
                      hoveredBar === idx
                        ? 'bg-[var(--aurora-aqua)] shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                        : 'bg-gradient-to-t from-[var(--aurora-iris)] to-[var(--aurora-aqua)] opacity-80 group-hover:opacity-100'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </TiltCard>

        {/* Card 2: Cross-Platform Tri-Target */}
        <TiltCard glowColor="rgba(6, 182, 212, 0.35)" className="flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--aurora-aqua)] to-[var(--aurora-jade)] text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <DevicesRoundedIcon sx={{ fontSize: 28 }} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">Tri-Platform Unity</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
              One shared codebase powering Web, standalone Windows Desktop (.exe), and native Android Super-App with zero divergence.
            </p>
          </div>

          {/* Interactive Platform Switcher */}
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => setPlatform('web')}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  platform === 'web'
                    ? 'bg-[var(--surface-hover)] text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <LanguageRoundedIcon sx={{ fontSize: 15 }} />
                Web
              </button>
              <button
                onClick={() => setPlatform('win')}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  platform === 'win'
                    ? 'bg-[var(--surface-hover)] text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <WindowRoundedIcon sx={{ fontSize: 15 }} />
                Windows
              </button>
              <button
                onClick={() => setPlatform('android')}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  platform === 'android'
                    ? 'bg-[var(--surface-hover)] text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <AndroidRoundedIcon sx={{ fontSize: 15 }} />
                Android
              </button>
            </div>

            <div className="mt-3 text-xs text-[var(--text-muted)] flex items-center justify-between">
              <span>Environment:</span>
              <span className="font-mono text-[var(--aurora-amber)] font-medium">
                {platform === 'web' && 'Next.js 16 App Router (Turbopack)'}
                {platform === 'win' && 'Electron 44 (120fps Frameless)'}
                {platform === 'android' && 'Capacitor 8.5.1 (Hardware 120Hz)'}
              </span>
            </div>
          </div>
        </TiltCard>

        {/* Card 3: Enterprise Tenancy & Security */}
        <TiltCard glowColor="rgba(244, 63, 94, 0.35)" className="flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--aurora-rose)] to-[var(--aurora-amber)] text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <SecurityRoundedIcon sx={{ fontSize: 28 }} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">Fortified Multi-Tenancy</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
              100% Row-Level Security (RLS) coverage verified by 103 automated Vitest security tests ensuring ironclad workspace isolation.
            </p>
          </div>

          {/* Micro-security Status Display */}
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Automated Security Tests:</span>
              <span className="font-mono text-[var(--aurora-jade)] font-bold flex items-center gap-1">
                <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
                103/103 Passing
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">IDOR Vulnerabilities:</span>
              <span className="font-mono text-[var(--aurora-jade)] font-bold">0 Detected</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Data Isolation:</span>
              <span className="font-mono text-[var(--aurora-aqua)] font-bold">Strict RLS with CHECK</span>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}
