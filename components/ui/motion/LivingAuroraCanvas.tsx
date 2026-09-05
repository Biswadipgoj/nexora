'use client';

import React from 'react';
import { motion } from 'motion/react';

export function LivingAuroraCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-75">
      {/* Electric Iris Orb */}
      <motion.div
        animate={{
          x: ['-4%', '8%', '-4%'],
          y: ['-8%', '12%', '-8%'],
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.32)_0%,transparent_70%)] blur-3xl will-change-transform"
      />
      {/* Neon Aqua Orb */}
      <motion.div
        animate={{
          x: ['8%', '-12%', '8%'],
          y: ['12%', '-8%', '12%'],
          scale: [1.1, 0.95, 1.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -right-40 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.26)_0%,transparent_70%)] blur-3xl will-change-transform"
      />
      {/* Cosmic Rose Orb */}
      <motion.div
        animate={{
          x: ['-8%', '12%', '-8%'],
          y: ['16%', '-12%', '16%'],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.18)_0%,transparent_70%)] blur-3xl will-change-transform"
      />
      {/* Solar Gold Glow Center */}
      <motion.div
        animate={{
          opacity: [0.15, 0.28, 0.15],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-1/4 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,transparent_70%)] blur-3xl will-change-transform"
      />
    </div>
  );
}
