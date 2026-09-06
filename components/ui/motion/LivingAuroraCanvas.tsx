'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Ambient aurora for the marketing surface.
 *
 * Section 3.2: "Decorative 3D objects belong on the marketing page, not behind
 * every task." This is deliberately not used on the dashboard or the project
 * board — the authenticated workspace prioritises focus over atmosphere.
 *
 * Section 9: reduced-motion disables aurora drift. The orbs still render, so
 * the composition keeps its depth; they simply hold still.
 */
export function LivingAuroraCanvas() {
  const reduceMotion = useReducedMotion();

  const drift = (
    keyframes: { x?: string[]; y?: string[]; scale?: number[]; opacity?: number[] },
    duration: number
  ) =>
    reduceMotion
      ? undefined
      : { animate: keyframes, transition: { duration, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <div className="aurora-canvas-wrap" aria-hidden="true">
      <motion.div
        className="aurora-orb aurora-orb--iris"
        {...drift({ x: ['-4%', '8%', '-4%'], y: ['-8%', '12%', '-8%'], scale: [1, 1.12, 1] }, 16)}
      />
      <motion.div
        className="aurora-orb aurora-orb--aqua"
        {...drift({ x: ['8%', '-12%', '8%'], y: ['12%', '-8%', '12%'], scale: [1.1, 0.95, 1.1] }, 20)}
      />
      <motion.div
        className="aurora-orb aurora-orb--rose"
        {...drift({ x: ['-8%', '12%', '-8%'], y: ['16%', '-12%', '16%'] }, 24)}
      />
      <motion.div
        className="aurora-orb aurora-orb--amber"
        {...drift({ opacity: [0.15, 0.28, 0.15], scale: [0.95, 1.05, 0.95] }, 14)}
      />
    </div>
  );
}
