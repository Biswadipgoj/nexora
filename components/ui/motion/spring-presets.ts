/**
 * Calibrated spring physics presets for NEXORA Prismatic Aurora motion system.
 * Built with Motion v13 (type: 'spring').
 */

export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 450,
  damping: 30,
} as const;

export const SPRING_DRAG = {
  type: 'spring',
  stiffness: 320,
  damping: 24,
} as const;

export const SPRING_DRAWER = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
} as const;

export const SPRING_BOUNCE = {
  type: 'spring',
  stiffness: 500,
  damping: 20,
} as const;

export const SPRING_GENTLE = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
} as const;
