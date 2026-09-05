'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Logo } from '@/components/ui/Logo';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { SPRING_SNAPPY } from '@/components/ui/motion/spring-presets';

export function LandingHeader({ user }: { user: any }) {
  return (
    <header className="landing-header-wrap">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_SNAPPY}
        className="landing-header-pill"
      >
        <Link href="/" className="landing-brand-link">
          <Logo size="md" withText animated />
        </Link>

        <nav className="landing-nav-links" aria-label="Main Navigation">
          <a href="#features" className="landing-nav-link">
            Features
          </a>
          <a href="#sandbox" className="landing-nav-link">
            Live Sandbox
          </a>
          <a href="#platforms" className="landing-nav-link">
            Cross-Platform
          </a>
        </nav>

        <div className="landing-header-actions">
          {user ? (
            <Link href="/dashboard" className="btn-landing-primary">
              <span>Go to Workspace</span>
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-landing-ghost">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-landing-primary">
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
