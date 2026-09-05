import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Prismatic Aurora Design Tokens', () => {
  it('defines all required non-dark, non-white, and dimensional variables in CSS', () => {
    const cssPath = path.resolve(process.cwd(), 'styles/prismatic-aurora.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const content = fs.readFileSync(cssPath, 'utf-8');

    expect(content).toContain('--canvas-bg: #dbe4f2');
    expect(content).toContain('--aurora-iris: #4f46e5');
    expect(content).toContain('--aurora-aqua: #0284c7');
    expect(content).toContain('--aurora-amber: #d97706');
    expect(content).toContain('--aurora-rose: #dc2626');
    expect(content).toContain('--aurora-jade: #059669');
    expect(content).toContain('--border-rim-highlight');
    expect(content).toContain('--shadow-lifted');
  });
});
