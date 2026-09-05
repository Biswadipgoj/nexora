'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';

interface CreatorBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  scale: number;
}

const SPARKLE_COLORS = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#dc2626', '#8b5cf6'];

export function CreatorBadge({ className = '', size = 'md' }: CreatorBadgeProps) {
  const [isBursting, setIsBursting] = useState(false);
  const [particles, setParticles] = useState<SparkleParticle[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isBursting) return;

    // Generate burst particles
    const newParticles: SparkleParticle[] = Array.from({ length: 14 }).map((_, i) => {
      const angle = (i / 14) * (Math.PI * 2) + (Math.random() * 0.4 - 0.2);
      const distance = 40 + Math.random() * 50;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
        scale: 0.6 + Math.random() * 0.8,
      };
    });

    setParticles(newParticles);
    setIsBursting(true);

    // Playful delay before teleporting to biswadip.in
    setTimeout(() => {
      window.open('https://biswadip.in', '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        setIsBursting(false);
        setParticles([]);
      }, 400);
    }, 600);
  };

  return (
    <div className={`creator-badge-wrapper ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Particle Explosion Effects */}
      <AnimatePresence>
        {isBursting &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0, p.scale, 0],
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                pointerEvents: 'none',
                zIndex: 30,
              }}
            />
          ))}
      </AnimatePresence>

      {/* Main Interactive Button */}
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{
          scale: 1.05,
          y: -2,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.22), inset 0 1.5px 0 #ffffff',
        }}
        whileTap={{ scale: 0.94 }}
        animate={
          isBursting
            ? {
                scale: [1, 1.25, 0.92, 1.15, 1],
                rotate: [0, -8, 8, -4, 4, 0],
                transition: { duration: 0.55, ease: 'easeInOut' },
              }
            : {}
        }
        className={`creator-badge ${size === 'sm' ? 'creator-badge--sm' : ''}`}
        aria-label="Crafted by Biswadip Goj — click to visit biswadip.in"
        title="Click to visit biswadip.in ✨"
      >
        <span className="creator-badge-glow" />

        <div className="creator-badge-inner">
          {isBursting ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="creator-badge-launching"
            >
              <RocketLaunchRoundedIcon sx={{ fontSize: 16, color: '#2563eb' }} />
              <span className="creator-launch-text">Teleporting to biswadip.in...</span>
            </motion.div>
          ) : (
            <>
              <span className="creator-sparkle-icon">
                <AutoAwesomeRoundedIcon sx={{ fontSize: 15, color: '#4f46e5' }} />
              </span>

              <span className="creator-prefix">Crafted with precision by</span>

              <span className="creator-name">
                BISWADIP GOJ
              </span>

              <span className="creator-arrow">✦</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  );
}
