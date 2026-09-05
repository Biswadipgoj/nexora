import { describe, it, expect } from 'vitest';
import { TASK_CATEGORIES, getCategoryByIdOrName } from '@/lib/constants/categories';

describe('Task Categories Definition & Resolver', () => {
  it('contains 8 rich categories including UI Design and Security', () => {
    expect(TASK_CATEGORIES.length).toBe(8);
    const ui = TASK_CATEGORIES.find((c) => c.id === 'type-ui');
    const security = TASK_CATEGORIES.find((c) => c.id === 'type-security');

    expect(ui).toBeDefined();
    expect(ui?.name).toBe('UI / UX Design');
    expect(ui?.icon).toBe('🎨');
    expect(ui?.color).toBe('#7c3aed');

    expect(security).toBeDefined();
    expect(security?.name).toBe('Security & Auth');
    expect(security?.icon).toBe('🛡️');
    expect(security?.color).toBe('#dc2626');
  });

  it('correctly resolves category by ID', () => {
    expect(getCategoryByIdOrName('type-ui').shortName).toBe('UI Design');
    expect(getCategoryByIdOrName('type-security').shortName).toBe('Security');
    expect(getCategoryByIdOrName('type-bug').shortName).toBe('Bug');
    expect(getCategoryByIdOrName('type-backend').shortName).toBe('Backend');
  });

  it('correctly resolves category by keyword heuristic', () => {
    expect(getCategoryByIdOrName('Security Audit').shortName).toBe('Security');
    expect(getCategoryByIdOrName('UI / UX Revamp').shortName).toBe('UI Design');
    expect(getCategoryByIdOrName('Critical Bug in login').shortName).toBe('Bug');
    expect(getCategoryByIdOrName('New Feature request').shortName).toBe('Feature');
    expect(getCategoryByIdOrName('API Endpoint Optimization').shortName).toBe('Backend');
    expect(getCategoryByIdOrName('DevOps Pipeline').shortName).toBe('DevOps');
    expect(getCategoryByIdOrName('API Documentation').shortName).toBe('Docs');
  });

  it('falls back gracefully to General Task for empty or unknown names', () => {
    expect(getCategoryByIdOrName('').shortName).toBe('Task');
    expect(getCategoryByIdOrName(undefined).shortName).toBe('Task');
    expect(getCategoryByIdOrName('Random Chores').shortName).toBe('Task');
  });
});
