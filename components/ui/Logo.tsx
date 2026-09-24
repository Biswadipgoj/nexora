import React from 'react';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LogoProps {
  size?: LogoSize;
  withText?: boolean;
  className?: string;
  /** Kept for call-site compatibility; the mark no longer animates. */
  animated?: boolean;
}

const SIZE_MAP: Record<LogoSize, { px: number; fontSize: string; gap: number }> = {
  sm: { px: 22, fontSize: '1.0625rem', gap: 8 },
  md: { px: 26, fontSize: '1.1875rem', gap: 9 },
  lg: { px: 36, fontSize: '1.5rem', gap: 11 },
  xl: { px: 52, fontSize: '2rem', gap: 14 },
};

/**
 * The Nexora mark: an ink tile holding an N made of two uprights and one
 * diagonal — the same geometry as public/logo.svg, which every generated icon
 * is rendered from. In the app the tile takes the ink colour and the glyph
 * the canvas colour, so it inverts cleanly in dark mode.
 */
export function Logo({ size = 'md', withText = true, className }: LogoProps) {
  const { px, fontSize, gap } = SIZE_MAP[size];

  const mark = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Nexora"
      style={{ display: 'block', flexShrink: 0 }}
      className={withText ? undefined : className}
    >
      <rect x="0" y="0" width="100" height="100" rx="22" fill="var(--nx-ink)" />
      <g fill="var(--nx-canvas)">
        <path d="M26 28h14v44H26z" />
        <path d="M60 28h14v44H60z" />
        <path d="M26 28h14l34 44H60z" />
      </g>
    </svg>
  );

  if (!withText) return mark;

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {mark}
      <span
        style={{
          fontFamily: 'var(--nx-font-serif)',
          fontWeight: 600,
          fontSize,
          letterSpacing: '-0.02em',
          color: 'var(--nx-ink)',
          lineHeight: 1,
        }}
      >
        Nexora
      </span>
    </span>
  );
}
