import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Guards the luminous light luxury system and scaled container dimensions (+600px).
 */

const read = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), 'utf-8');

describe('Nexora canonical design tokens (Luminous Light Luxury)', () => {
  it('defines the light luxury palette', () => {
    const css = read('styles/nexora-tokens.css');

    // Canvas and surfaces
    expect(css).toContain('--nx-bg: #F8FAFC');
    expect(css).toContain('--nx-bg-raised: #FFFFFF');
    expect(css).toContain('--nx-surface: #FFFFFF');
    expect(css).toContain('--nx-surface-2: #F1F5F9');
    expect(css).toContain('--nx-surface-3: #E2E8F0');

    // Borders
    expect(css).toContain('--nx-border: rgba(15, 23, 42, 0.08)');
    expect(css).toContain('--nx-border-strong: rgba(99, 102, 241, 0.35)');

    // Text
    expect(css).toContain('--nx-text: #0F172A');
    expect(css).toContain('--nx-text-2: #334155');
    expect(css).toContain('--nx-text-3: #64748B');

    // Accents
    expect(css).toContain('--nx-blue: #2563EB');
    expect(css).toContain('--nx-cyan: #0891B2');
    expect(css).toContain('--nx-violet: #7C3AED');
    expect(css).toContain('--nx-green: #059669');
    expect(css).toContain('--nx-amber: #D97706');
    expect(css).toContain('--nx-red: #E11D48');
  });

  it('defines the radius scale and motion scale', () => {
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

  it('honours prefers-reduced-motion', () => {
    const css = read('styles/nexora-tokens.css');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    // Aurora drift, tilt and parallax must be disabled, not merely shortened.
    expect(css).toMatch(/\.aurora-orb[\s\S]*animation: none/);
  });

  it('exposes a visible focus ring for keyboard users', () => {
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
});

describe('Application shell & light theme integration', () => {
  it('renders the application shell on the light canvas', () => {
    const globals = read('app/globals.css');
    expect(globals).toContain('--color-text-primary: var(--nx-text)');
    expect(globals).toContain('--color-bg: var(--nx-bg)');

    const layout = read('app/layout.tsx');
    expect(layout).toContain('data-theme="light"');
    expect(layout).toContain("themeColor: '#F8FAFC'");
  });

  it('configures the theme provider with light mode default', () => {
    const provider = read('components/theme/ThemeProvider.tsx');
    expect(provider).toContain("const THEME: Theme = 'light'");
  });
});

describe('Layout scaled up by +600px', () => {
  it('scales the Electron desktop window width to 2000px', () => {
    const electron = read('electron/main.js');
    expect(electron).toContain('width: 2000');
    expect(electron).toContain("backgroundColor: '#F8FAFC'");
  });

  it('scales the dashboard main stage to 2200px', () => {
    const dash = read('components/dashboard/dashboard.css');
    expect(dash).toContain('max-width: 2200px');
  });

  it('scales the landing hero and component containers by 600px', () => {
    const comp = read('styles/prismatic-components.css');
    expect(comp).toContain('max-width: 1740px'); // landing hero & features (+600px from 1140px)
    expect(comp).toContain('max-width: 2000px'); // project board stage (+600px from 1400px)
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
  });

  it('points the manifest at the generated launcher icons and light theme', () => {
    const manifest = read('app/manifest.ts');
    expect(manifest).toContain('/android-chrome-192.png');
    expect(manifest).toContain('/android-chrome-512.png');
    expect(manifest).toContain("theme_color: '#F8FAFC'");
    expect(manifest).toContain("background_color: '#F8FAFC'");
  });
});
