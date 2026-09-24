import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Guards the Nexora design system: stone paper, graphite ink, one blue-black
 * accent, status colours on their own axis, and a designed dark theme.
 */

const read = (relative: string) => fs.readFileSync(path.resolve(process.cwd(), relative), 'utf-8');
const tokens = read('styles/nexora-tokens.css');

/** The bare :root block — the only place a colour may be first defined. */
const rootBlock = tokens.slice(tokens.indexOf(':root {'), tokens.indexOf('\n}\n', tokens.indexOf(':root {')));

function hex(name: string, block = rootBlock): string {
  const match = block.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
  expect(match, `${name} missing`).not.toBeNull();
  return match![1];
}

/** WCAG relative luminance and contrast ratio. */
function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('Design tokens', () => {
  it('defines the complete light palette on bare :root', () => {
    for (const name of [
      '--nx-canvas',
      '--nx-surface',
      '--nx-surface-2',
      '--nx-surface-3',
      '--nx-line',
      '--nx-line-strong',
      '--nx-ink',
      '--nx-ink-2',
      '--nx-ink-3',
      '--nx-accent',
      '--nx-on-accent',
      '--nx-green',
      '--nx-amber',
      '--nx-red',
    ]) {
      hex(name);
    }
  });

  it('keeps text readable: 4.5:1 for every ink on the surfaces it sits on', () => {
    for (const ground of ['--nx-surface', '--nx-canvas']) {
      for (const ink of ['--nx-ink', '--nx-ink-2', '--nx-ink-3']) {
        expect(contrast(hex(ink), hex(ground)), `${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contrast(hex('--nx-on-accent'), hex('--nx-accent'))).toBeGreaterThanOrEqual(4.5);
    for (const status of ['--nx-green', '--nx-amber', '--nx-red']) {
      expect(contrast(hex(status), hex('--nx-surface')), status).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('redefines tokens for dark mode under both the system preference and an explicit choice', () => {
    expect(tokens).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme='light'\]\)/);
    expect(tokens).toContain(":root[data-theme='dark']");

    const explicitDark = tokens.slice(tokens.indexOf(":root[data-theme='dark']"));
    expect(contrast(hex('--nx-ink', explicitDark), hex('--nx-surface', explicitDark))).toBeGreaterThanOrEqual(7);
    expect(contrast(hex('--nx-ink-3', explicitDark), hex('--nx-surface', explicitDark))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hex('--nx-on-accent', explicitDark), hex('--nx-accent', explicitDark))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps hover and panel motion in their ranges and honours reduced motion', () => {
    const hover = tokens.match(/--nx-motion-hover:\s*(\d+)ms/);
    const panel = tokens.match(/--nx-motion-panel:\s*(\d+)ms/);
    expect(Number(hover?.[1])).toBeGreaterThanOrEqual(120);
    expect(Number(hover?.[1])).toBeLessThanOrEqual(180);
    expect(Number(panel?.[1])).toBeGreaterThanOrEqual(200);
    expect(Number(panel?.[1])).toBeLessThanOrEqual(300);
    expect(tokens).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('exposes a visible focus ring for keyboard users', () => {
    expect(tokens).toContain('--nx-focus-ring');
    expect(tokens).toContain(':focus-visible');
  });
});

describe('Nothing decorative that the product does not need', () => {
  const shared = ['app/globals.css', 'styles/nexora-tokens.css', 'styles/nexora-auth.css'].map(read).join('\n');

  it('has no gradient text, glow orbs or aurora layers', () => {
    expect(shared).not.toMatch(/background-clip:\s*text/);
    expect(shared).not.toMatch(/aurora/i);
    expect(shared).not.toMatch(/radial-gradient/);
  });

  it('removed the ambient aurora, tilt and sparkle components', () => {
    for (const gone of [
      'components/ui/motion/LivingAuroraCanvas.tsx',
      'components/ui/motion/TiltCard.tsx',
      'components/dashboard/AnimatedBackground.tsx',
      'styles/prismatic-aurora.css',
    ]) {
      expect(fs.existsSync(path.resolve(process.cwd(), gone)), gone).toBe(false);
    }
  });
});

describe('Theme integration', () => {
  it('applies a stored theme before first paint and follows the system otherwise', () => {
    const layout = read('app/layout.tsx');
    expect(layout).toContain('THEME_INIT_SCRIPT');
    expect(layout).not.toContain('data-theme="light"');

    const provider = read('components/theme/ThemeProvider.tsx');
    expect(provider).toContain("'system'");
    expect(provider).toContain('prefers-color-scheme: dark');
  });

  it('sizes the desktop window to fit a laptop screen', () => {
    const electron = read('electron/main.js');
    const width = Number(electron.match(/width:\s*(\d+)/)?.[1]);
    const minWidth = Number(electron.match(/minWidth:\s*(\d+)/)?.[1]);
    expect(width).toBeLessThanOrEqual(1600);
    expect(minWidth).toBeLessThanOrEqual(1024);
    expect(electron).toContain("backgroundColor: '#F2F2EE'");
  });
});

describe('Identity system', () => {
  it('ships the full icon set generated from the master mark', () => {
    for (const asset of [
      'public/logo.svg',
      'app/icon.svg',
      'app/favicon.ico',
      'app/apple-icon.png',
      'public/favicon-32.png',
      'public/apple-touch-icon.png',
      'public/android-chrome-192.png',
      'public/android-chrome-512.png',
      'electron/icon.ico',
      'electron/icon.png',
    ]) {
      expect(fs.existsSync(path.resolve(process.cwd(), asset)), `missing ${asset}`).toBe(true);
    }
  });

  it('keeps the wordmark out of the favicon and states the mark geometry', () => {
    const svg = read('public/logo.svg');
    expect(svg.toLowerCase()).not.toContain('>nexora<');
    expect(svg).toContain('M26 28h14v44H26z');
    expect(svg).toContain('M60 28h14v44H60z');
    expect(svg).toContain('M26 28h14l34 44H60z');
    // A solid mark: no gradients to muddy it at 16px.
    expect(svg).not.toContain('Gradient');
  });

  it('points the manifest at the generated launcher icons and the canvas colour', () => {
    const manifest = read('app/manifest.ts');
    expect(manifest).toContain('/android-chrome-192.png');
    expect(manifest).toContain('/android-chrome-512.png');
    expect(manifest).toContain("theme_color: '#F2F2EE'");
    expect(manifest).toContain("background_color: '#F2F2EE'");
  });
});
