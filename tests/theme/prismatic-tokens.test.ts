import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Prismatic Aurora Design Tokens', () => {
  it('defines all required non-dark, non-white, and dimensional variables in CSS', () => {
    const cssPath = path.resolve(process.cwd(), 'styles/prismatic-aurora.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const content = fs.readFileSync(cssPath, 'utf-8');

    expect(content).toContain('--canvas-bg: #181d2e');
    expect(content).toContain('--aurora-iris: #8b5cf6');
    expect(content).toContain('--aurora-aqua: #06b6d4');
    expect(content).toContain('--aurora-amber: #f59e0b');
    expect(content).toContain('--aurora-rose: #f43f5e');
    expect(content).toContain('--aurora-jade: #10b981');
    expect(content).toContain('--border-rim-highlight');
    expect(content).toContain('--shadow-lifted');
  });
});
