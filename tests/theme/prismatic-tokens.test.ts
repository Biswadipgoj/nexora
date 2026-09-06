import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Guards the obsidian dark system defined by the Master Product Design and
 * Production Readiness Document.
 *
 * Section 2 replaced the "Executive Luminous Platinum" light palette with
 * obsidian dark as the default authenticated experience. Section 10 makes the
 * rule enforceable: "Use semantic tokens and prohibit hard-coded pale surfaces
 * in authenticated UI."
 */

const read = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), 'utf-8');

/** Stylesheets and components that make up the authenticated experience. */
const AUTHENTICATED_SOURCES = [
  'app/globals.css',
  'styles/nexora-tokens.css',
  'styles/prismatic-aurora.css',
  'styles/prismatic-components.css',
  'styles/nexora-auth.css',
  'components/dashboard/dashboard.css',
  'components/navigation/super-app-bar.css',
];

describe('Nexora canonical design tokens', () => {
  it('defines the section 4.1 palette', () => {
    const css = read('styles/nexora-tokens.css');

    // Canvas and surfaces
    expect(css).toContain('--nx-bg: #080B12');
    expect(css).toContain('--nx-bg-raised: #0E131D');
    expect(css).toContain('--nx-surface: #121A27');
    expect(css).toContain('--nx-surface-2: #172235');
    expect(css).toContain('--nx-surface-3: #1D2B40');

    // Borders
    expect(css).toContain('--nx-border: rgba(174, 205, 255, 0.14)');
    expect(css).toContain('--nx-border-strong: rgba(174, 205, 255, 0.28)');

    // Text
    expect(css).toContain('--nx-text: #F4F7FB');
    expect(css).toContain('--nx-text-2: #B9C5D6');
    expect(css).toContain('--nx-text-3: #7E8DA3');

    // Accents
    expect(css).toContain('--nx-blue: #6EA8FF');
    expect(css).toContain('--nx-cyan: #46D7E8');
    expect(css).toContain('--nx-violet: #9B8CFF');
    expect(css).toContain('--nx-green: #57D39A');
    expect(css).toContain('--nx-amber: #F1B86A');
    expect(css).toContain('--nx-red: #FF7185');
  });

  it('defines the section 4.4 radius scale and section 4.5 motion scale', () => {
    const css = read('styles/nexora-tokens.css');

    expect(css).toContain('--nx-radius-control: 8px');
    expect(css).toContain('--nx-radius-card: 12px');
    expect(css).toContain('--nx-radius-panel: 16px');
    expect(css).toContain('--nx-radius-shell: 22px');

    // Hover 140-180ms, panels 220-280ms
    const hover = css.match(/--nx-motion-hover:\s*(\d+)ms/);
    const panel = css.match(/--nx-motion-panel:\s*(\d+)ms/);
    expect(hover).not.toBeNull();
    expect(panel).not.toBeNull();
    expect(Number(hover![1])).toBeGreaterThanOrEqual(140);
    expect(Number(hover![1])).toBeLessThanOrEqual(180);
    expect(Number(panel![1])).toBeGreaterThanOrEqual(220);
    expect(Number(panel![1])).toBeLessThanOrEqual(280);
  });

  it('honours prefers-reduced-motion (section 9)', () => {
    const css = read('styles/nexora-tokens.css');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    // Aurora drift, tilt and parallax must be disabled, not merely shortened.
    expect(css).toMatch(/\.aurora-orb[\s\S]*animation: none/);
  });

  it('exposes a visible focus ring for keyboard users (section 9)', () => {
    const css = read('styles/nexora-tokens.css');
    expect(css).toContain('--nx-focus-ring');
    expect(css).toContain(':focus-visible');
  });
});

describe('Legacy token compatibility layer', () => {
  it('maps the legacy aurora names onto the canonical palette', () => {
    const css = read('styles/prismatic-aurora.css');

    for (const mapping of [
      '--canvas-bg: var(--nx-bg)',
      '--surface-primary: var(--nx-surface)',
      '--text-main: var(--nx-text)',
      '--text-muted: var(--nx-text-2)',
      '--text-subtle: var(--nx-text-3)',
      '--aurora-iris: var(--nx-violet)',
      '--aurora-aqua: var(--nx-cyan)',
      '--aurora-amber: var(--nx-amber)',
      '--aurora-rose: var(--nx-red)',
      '--aurora-jade: var(--nx-green)',
    ]) {
      expect(css).toContain(mapping);
    }
  });

  it('no longer declares the light "Executive Luminous Platinum" palette', () => {
    const css = read('styles/prismatic-aurora.css');
    expect(css).not.toContain('#dbe4f2');
    expect(css).not.toContain('--text-main: #0f172a');
  });
});

describe('Theme mismatch guard (section 10)', () => {
  it('keeps hard-coded pale surfaces out of the authenticated stylesheets', () => {
    const offenders: string[] = [];

    for (const file of AUTHENTICATED_SOURCES) {
      const css = read(file);
      css.split('\n').forEach((line, index) => {
        // A white or near-white fill or border. Low-alpha whites are allowed:
        // they are the inset bevel rims the surface recipe in section 4.2 uses.
        const paleWhite = /(background|border|border-color|color)\s*:[^;]*(#f{3,6}\b|#F{3,6}\b|rgba\(255,\s*255,\s*255,\s*0?\.[2-9])/;
        // Light-theme slate ramp.
        const paleSlate = /#(0f172a|1e293b|334155|64748b|94a3b8|cbd5e1|e2e8f0|f1f5f9|f8fafc|dbe4f2)\b/i;
        if (paleWhite.test(line) || paleSlate.test(line)) {
          offenders.push(`${file}:${index + 1}  ${line.trim()}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('renders the application shell on the dark canvas', () => {
    const globals = read('app/globals.css');
    expect(globals).toContain('--color-text-primary: var(--nx-text)');
    expect(globals).toContain('--color-bg: var(--nx-bg)');

    const layout = read('app/layout.tsx');
    expect(layout).toContain('data-theme="dark"');
    expect(layout).toContain("themeColor: '#080B12'");
  });
});

describe('Identity system (section 8)', () => {
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
    // "Do not place the full wordmark inside the favicon."
    expect(svg.toLowerCase()).not.toContain('>nexora<');
    // Two vertical strokes and one diagonal bridge.
    expect(svg).toContain('M26 28h14v44H26z');
    expect(svg).toContain('M60 28h14v44H60z');
    expect(svg).toContain('M26 28h14l34 44H60z');
  });

  it('points the manifest at the generated launcher icons', () => {
    const manifest = read('app/manifest.ts');
    expect(manifest).toContain('/android-chrome-192.png');
    expect(manifest).toContain('/android-chrome-512.png');
    expect(manifest).toContain("theme_color: '#080B12'");
  });
});
