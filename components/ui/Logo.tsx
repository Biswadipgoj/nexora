'use client';

import React from 'react';
import { motion } from 'motion/react';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export interface LogoProps {
  size?: LogoSize;
  animated?: boolean;
  withText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number; fontSize: string; gap: number }> = {
  sm: { width: 22, height: 22, fontSize: '0.9rem', gap: 6 },
  md: { width: 36, height: 36, fontSize: '1.25rem', gap: 10 },
  lg: { width: 48, height: 48, fontSize: '1.5rem', gap: 12 },
  xl: { width: 72, height: 72, fontSize: '2.25rem', gap: 16 },
  hero: { width: 120, height: 120, fontSize: '3.5rem', gap: 24 }
};

export function Logo({ size = 'md', animated = false, withText = true, className, style }: LogoProps) {
  const dimensions = SIZE_MAP[size];

  // The premium Nexora Mark constructed with bold geometric shapes 
  // utilizing the 80% Material / 20% Maximalism aesthetic.
  const logoMark = (
    <svg 
      width={dimensions.width} 
      height={dimensions.height} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ 
        display: 'block', 
        flexShrink: 0, 
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))',
        ...style 
      }}
    >
      <defs>
        {/* Core vibrant gradient */}
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo */}
          <stop offset="50%" stopColor="#8B5CF6" /> {/* Violet */}
          <stop offset="100%" stopColor="#EC4899" /> {/* Pink */}
        </linearGradient>
        
        {/* Subtle inner glass highlight */}
        <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
        </linearGradient>
        
        {/* Animated fluid gradient for maximalist energy */}
        <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="200%" y2="200%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="33%" stopColor="#EC4899" />
          <stop offset="66%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#4F46E5" />
          {animated && (
            <animate attributeName="x1" values="0%;-100%;0%" dur="8s" repeatCount="indefinite" />
          )}
          {animated && (
            <animate attributeName="x2" values="200%;100%;200%" dur="8s" repeatCount="indefinite" />
          )}
          {animated && (
            <animate attributeName="y1" values="0%;-50%;0%" dur="6s" repeatCount="indefinite" />
          )}
        </linearGradient>

        <linearGradient id="stemLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" /> {/* Cyan 400 */}
          <stop offset="100%" stopColor="#3B82F6" /> {/* Blue 500 */}
        </linearGradient>

        <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D946EF" /> {/* Fuchsia 500 */}
          <stop offset="100%" stopColor="#F43F5E" /> {/* Rose 500 */}
        </linearGradient>

        <linearGradient id="stemRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" /> {/* Amber 400 */}
          <stop offset="100%" stopColor="#F97316" /> {/* Orange 500 */}
        </linearGradient>
      </defs>

      {/* Base Circle with Gradient */}
      <circle cx="50" cy="50" r="48" fill={animated ? "url(#animatedGradient)" : "url(#primaryGradient)"} />
      
      {/* N Lettermark Paths with subtle Framer Motion entry */}
      <motion.g 
        initial={animated ? { opacity: 0, scale: 0.8, y: 5 } : false}
        animate={animated ? { opacity: 1, scale: 1, y: 0 } : false}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        {/* Left Stem */}
        <path d="M30 30 C 30 25, 42 25, 42 30 V 70 C 42 75, 30 75, 30 70 Z" fill="url(#stemLeft)" />
        
        {/* Diagonal Cross */}
        <path d="M36 30 L 70 70 L 60 76 L 26 36 Z" fill="url(#crossGrad)" opacity="0.95" />
        
        {/* Right Stem */}
        <path d="M58 30 C 58 25, 70 25, 70 30 V 70 C 70 75, 58 75, 58 70 Z" fill="url(#stemRight)" />

        {/* Glass reflection overlay */}
        <circle cx="50" cy="50" r="48" fill="url(#glassHighlight)" style={{ mixBlendMode: 'overlay' }} />
      </motion.g>
    </svg>
  );

  if (withText) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: dimensions.gap, textDecoration: 'none' }}>
        {logoMark}
        <motion.span 
          initial={animated ? { opacity: 0, x: -10 } : false}
          animate={animated ? { opacity: 1, x: 0 } : false}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          style={{ 
            fontFamily: "'Outfit', sans-serif", 
            fontWeight: 800, 
            fontSize: dimensions.fontSize, 
            letterSpacing: '-0.02em', 
            color: 'var(--color-text-primary, #0F172A)',
            lineHeight: 1
          }}
        >
          NEXORA
        </motion.span>
      </div>
    );
  }

  return logoMark;
}
