'use client';

import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export interface LogoProps {
  size?: LogoSize;
  /** Plays a short entry animation. Ignored under prefers-reduced-motion. */
  animated?: boolean;
  withText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<LogoSize, { px: number; fontSize: string; gap: number }> = {
  sm: { px: 24, fontSize: '0.9375rem', gap: 8 },
  md: { px: 32, fontSize: '1.125rem', gap: 10 },
  lg: { px: 44, fontSize: '1.5rem', gap: 12 },
  xl: { px: 64, fontSize: '2rem', gap: 16 },
  hero: { px: 104, fontSize: '3rem', gap: 22 },
};

/**
 * The Nexora mark — Master Design Document, section 8.
 *
 * "a rounded obsidian tile containing a simplified luminous N formed by two
 * vertical strokes and one diagonal bridge. Use a blue-to-violet accent only
 * inside the mark, with a thin cyan highlight."
 *
 * This is the same geometry as public/logo.svg, which is the source artwork for
 * every generated icon (scripts/generate-icons.mjs). Change one, regenerate the
 * other, so the brand does not drift between the app and the platform icons.
 */
export function Logo({
  size = 'md',
  animated = false,
  withText = true,
  className,
  style,
}: LogoProps) {
  const { px, fontSize, gap } = SIZE_MAP[size];
  const reduceMotion = useReducedMotion();
  // Gradient ids must be unique per instance, or a second Logo on the page
  // re-points the first one's fills at its own defs.
  const uid = useId().replace(/:/g, '');
  const tile = `nx-tile-${uid}`;
  const glyph = `nx-glyph-${uid}`;
  const edge = `nx-edge-${uid}`;

  const playEntry = animated && !reduceMotion;

  const mark = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      role="img"
      aria-label="Nexora"
    >
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="0.65" y2="1">
          <stop offset="0" stopColor="#151F30" />
          <stop offset="1" stopColor="#070A11" />
        </linearGradient>
        <linearGradient id={glyph} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="var(--nx-cyan, #46D7E8)" />
          <stop offset="0.32" stopColor="var(--nx-blue, #6EA8FF)" />
          <stop offset="1" stopColor="var(--nx-violet, #9B8CFF)" />
        </linearGradient>
        <linearGradient id={edge} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#46D7E8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8BE6F2" stopOpacity="0.85" />
          <stop offset="1" stopColor="#9B8CFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Obsidian tile with a dark rim so the mark holds on any surface */}
      <rect x="1" y="1" width="98" height="98" rx="24" fill={`url(#${tile})`} />
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="24"
        fill="none"
        stroke="#AECDFF"
        strokeOpacity="0.16"
        strokeWidth="2"
      />

      {/* Thin cyan edge light */}
      <path d="M26 3.5 H74" stroke={`url(#${edge})`} strokeWidth="1.5" strokeLinecap="round" />

      <motion.g
        fill={`url(#${glyph})`}
        initial={playEntry ? { opacity: 0, y: 4 } : false}
        animate={playEntry ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <path d="M26 28h14v44H26z" />
        <path d="M60 28h14v44H60z" />
        <path d="M26 28h14l34 44H60z" />
      </motion.g>
    </svg>
  );

  if (!withText) return mark;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {mark}
      <span
        style={{
          fontFamily: 'var(--nx-font-display)',
          fontWeight: 700,
          fontSize,
          letterSpacing: '-0.02em',
          color: 'var(--nx-text)',
          lineHeight: 1,
        }}
      >
        Nexora
      </span>
    </span>
  );
}
