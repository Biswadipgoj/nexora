'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Logo } from '@/components/ui/Logo';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { SPRING_SNAPPY } from '@/components/ui/motion/spring-presets';

export function LandingHeader({ user }: { user: any }) {
  return (
    <header className="sticky top-5 z-50 mx-auto max-w-6xl px-4">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_SNAPPY}
        className="flex items-center justify-between rounded-full border border-white/15 bg-[var(--surface-primary)] px-6 py-3 shadow-[var(--shadow-md)] backdrop-blur-2xl"
      >
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Logo size="md" withText animated />
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#sandbox" className="hover:text-white transition-colors">
            Live Sandbox
          </a>
          <a href="#platforms" className="hover:text-white transition-colors">
            Cross-Platform
          </a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--aurora-iris)] to-[var(--aurora-aqua)] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-transform hover:scale-105 active:scale-95"
            >
              <span>Go to Workspace</span>
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--aurora-iris)] to-[var(--aurora-aqua)] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-transform hover:scale-105 active:scale-95"
              >
                <span>Get Started Free</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </header>
  );
}
