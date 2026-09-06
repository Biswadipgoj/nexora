import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Guards the copy standard from section 6.1.
 *
 * "Retain one proof row below the CTA, but remove unsupported numerical claims
 * such as delivery multipliers or completion percentages unless they are backed
 * by a visible source and real product data."
 *
 * Invented statistics and borrowed social proof are the main reason a product
 * page reads as generated rather than built, and section 7 makes the same point
 * about imagery. This test fails the build if that copy returns.
 */

const SURFACES = [
  'app/page.tsx',
  'components/landing/LandingHeader.tsx',
  'components/landing/DimensionalFeatureGrid.tsx',
  'components/landing/HeroLiveSandbox.tsx',
  'components/dashboard/OverviewTab.tsx',
];

/** Strip comments so the rules below judge rendered copy, not the notes about it. */
function visibleCopy(file: string): string {
  return fs
    .readFileSync(path.resolve(process.cwd(), file), 'utf-8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('Landing and dashboard copy carries no unsupported claims', () => {
  const banned: Array<[string, RegExp]> = [
    ['a speed or delivery multiplier', /\b\d+(\.\d+)?x\s+(faster|quicker|more|better|delivery)/i],
    ['an invented completion percentage', /\b\d{1,3}(\.\d+)?%\s*(on-?time|faster|of sprint|completion rate)/i],
    ['unquantified social proof', /\b(thousands|millions|hundreds)\s+of\s+(teams|companies|users|customers)/i],
    ['a trusted-by claim', /\btrusted by\b/i],
    ['a compliance certification claim', /\b(soc\s?2|iso\s?27001|hipaa|gdpr)[- ]?(compliant|certified)\b/i],
    ['continuous compliance wording', /continuous compliance/i],
    ['an award or rating claim', /\b(#1|rated|award-winning|best-in-class)\b/i],
  ];

  for (const file of SURFACES) {
    const copy = visibleCopy(file);

    for (const [label, pattern] of banned) {
      it(`${file} does not state ${label}`, () => {
        const match = copy.match(pattern);
        expect(match?.[0] ?? null).toBeNull();
      });
    }
  }

  it('the dashboard metrics are derived from work items, not hard-coded', () => {
    const overview = visibleCopy('components/dashboard/OverviewTab.tsx');
    // The strip previously rendered a literal "+24%" against a fixed 82% bar.
    expect(overview).not.toMatch(/\+\d+%/);
    expect(overview).not.toMatch(/width:\s*'\d+%'/);
    // Every count comes from the shared focus module rather than a literal.
    expect(overview).toContain('countFocus');
    expect(overview).toContain("from '@/lib/work/focus'");
  });

  it('the dashboard and My Tasks share one definition of overdue and due today', () => {
    // Section 5.2 requires a metric to "preserve the filter that produced it",
    // and section 5.4 requires the views to share filters. Both only hold if a
    // single module owns the definitions.
    const focus = fs.readFileSync(path.resolve(process.cwd(), 'lib/work/focus.ts'), 'utf-8');
    expect(focus).toContain('due_date');
    expect(focus).toMatch(/export function countFocus/);
    expect(focus).toMatch(/export function sortForFocus/);

    for (const consumer of ['components/dashboard/OverviewTab.tsx', 'components/dashboard/TasksTab.tsx']) {
      expect(visibleCopy(consumer), consumer).toContain("from '@/lib/work/focus'");
    }
  });

  it('the hero keeps one primary action and one demo action (section 6.1)', () => {
    const page = visibleCopy('app/page.tsx');
    const heroCtas = page.match(/btn-hero-cta--primary/g) ?? [];
    expect(heroCtas).toHaveLength(1);
    expect(page).toContain('DemoWorkspaceButton');
  });
});
