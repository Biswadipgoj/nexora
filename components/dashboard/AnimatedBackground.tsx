import React from 'react';
import { motion } from 'motion/react';

export function AnimatedBackground() {
  return (
    <>
      <div className="aurora-mesh" />
      <motion.div
        className="aurora-orb aurora-orb--1"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.div
        className="aurora-orb aurora-orb--2"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 60, -40, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="aurora-orb aurora-orb--3"
        animate={{
          x: [0, 30, -50, 0],
          y: [0, -40, 30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity, delay: 2 }}
      />
    </>
  );
}
