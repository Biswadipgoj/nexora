'use client';

import React from 'react';
import { motion } from 'motion/react';

export function LivingAuroraCanvas() {
  return (
    <div className="aurora-canvas-wrap" aria-hidden="true">
      {/* Electric Iris Orb */}
      <motion.div
        animate={{
          x: ['-4%', '8%', '-4%'],
          y: ['-8%', '12%', '-8%'],
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="aurora-orb aurora-orb--iris"
      />
      {/* Neon Aqua Orb */}
      <motion.div
        animate={{
          x: ['8%', '-12%', '8%'],
          y: ['12%', '-8%', '12%'],
          scale: [1.1, 0.95, 1.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="aurora-orb aurora-orb--aqua"
      />
      {/* Cosmic Rose Orb */}
      <motion.div
        animate={{
          x: ['-8%', '12%', '-8%'],
          y: ['16%', '-12%', '16%'],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="aurora-orb aurora-orb--rose"
      />
      {/* Solar Gold Glow Center */}
      <motion.div
        animate={{
          opacity: [0.15, 0.28, 0.15],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="aurora-orb aurora-orb--amber"
      />
    </div>
  );
}
