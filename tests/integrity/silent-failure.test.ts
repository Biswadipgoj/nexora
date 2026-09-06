import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Regression guards for defects where the product told the user one thing and
 * did another.
 *
 * Section 3.4: "A user must understand whether a change was saved, queued,
 * rejected, or still in progress."
 * Section 3.5: a contradictory label counts as an unresolved defect.
 */

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf-8');

/**
 * Source with comments stripped.
 *
 * Several guards below assert that a phrase no longer appears. The comments
 * explaining why it was removed necessarily quote it, so they must not be
 * matched or the guard fails against its own documentation.
 */
const code = (p: string) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('Writes never report a success that did not happen', () => {
  it('the create route does not fabricate a work item when the write fails', () => {
    const route = read('app/api/work-items/route.ts');
    // It used to return 201 with `id: 'wi-' + Date.now()` and a random sequence,
    // so an RLS denial was indistinguishable from a save.
    expect(route).not.toMatch(/fallbackItem/);
    expect(route).not.toMatch(/Math\.random\(\)\s*\*\s*900/);
    expect(route).toMatch(/status:\s*denied\s*\?\s*403\s*:\s*500/);
  });

  it('the quick-create modal reads the response and reconciles the stored row', () => {
    const modal = read('components/board/QuickCreateModal.tsx');
    expect(modal).toContain('onItemReconciled');
    expect(modal).toContain('onCreateFailed');
    expect(modal).toMatch(/if \(!res\.ok\)/);
  });

  it('board moves check the response and roll back when refused', () => {
    const board = read('components/board/KanbanBoard.tsx');
    expect(board).toMatch(/if \(!res\.ok\) throw new Error/);
    expect(board).toContain('previousStatusId');
    expect(board).toContain('moveError');
  });

  it('the detail drawer surfaces saving, saved and error states', () => {
    const drawer = read('components/board/WorkItemDetailDrawer.tsx');
    expect(drawer).toMatch(/saveState/);
    expect(drawer).toMatch(/'saving' \| 'saved' \| 'error'/);
    // Text edits are debounced rather than one PATCH per keystroke.
    expect(drawer).toContain('queueSave');
    expect(drawer).toContain('flushSave');
  });

  it('toggling a task in My Tasks persists', () => {
    const view = read('components/dashboard/DashboardClientView.tsx');
    expect(view).toMatch(/handleToggleTaskStatus[\s\S]{0,600}fetch\(`\/api\/work-items\//);
    // And the copy no longer promises sync that was never implemented.
    expect(read('components/dashboard/TasksTab.tsx')).not.toMatch(/instant tactile sync/i);
  });
});

describe('The quick-create form can hold a title', () => {
  it('does not put a fresh array literal in the reset effect dependencies', () => {
    const modal = read('components/board/QuickCreateModal.tsx');
    // An inline default array was rebuilt every render, so the reset effect
    // re-ran on each keystroke and cleared the field after one character.
    expect(modal).toContain('const FALLBACK_STATUSES');
    expect(modal).toContain('availableStatuses = FALLBACK_STATUSES');
    expect(modal).toMatch(/\}, \[isOpen\]\);/);
  });
});

describe('Updates accept the ids the app actually sends', () => {
  it('the update schema takes built-in slugs as well as UUIDs', () => {
    const schema = read('lib/validation/workspace.ts');
    expect(schema).toContain('const referenceId');
    expect(schema).toMatch(/status_id:\s*referenceId/);
    expect(schema).toMatch(/type_id:\s*referenceId/);
  });

  it('PATCH resolves slugs and strips fields that are not columns', () => {
    const route = read('app/api/work-items/[id]/route.ts');
    expect(route).toContain('resolveStatusForItem');
    // assignees / assignee_ids / comments are not columns on work_items.
    expect(route).toMatch(/const \{ description, assignees, assignee_ids, comments, \.\.\.columns \}/);
    // An activity-log failure must not turn a successful update into a 400.
    expect(route).toMatch(/try \{[\s\S]{0,400}activity_events[\s\S]{0,300}\} catch \{\}/);
  });

  it('the API and the board agree on the default status columns', () => {
    const route = read('app/api/work-items/route.ts');
    const board = read('components/board/KanbanBoard.tsx');
    for (const id of ['status-todo', 'status-in-progress', 'status-review', 'status-done']) {
      expect(route, `route missing ${id}`).toContain(id);
      expect(board, `board missing ${id}`).toContain(id);
    }
  });
});

describe('Nothing claims a capability the codebase does not have', () => {
  it('the share dialog does not report sending invitations', () => {
    const modal = code('components/board/ShareProjectModal.tsx');
    // There is no invite endpoint and no membership query anywhere.
    expect(modal).not.toMatch(/Invitation sent/i);
    expect(modal).not.toMatch(/handleSendInvite/);
    // And no invented members presented as real collaborators.
    expect(modal).not.toMatch(/Alex Morgan|Sarah Chen/);
    expect(modal).toMatch(/const INITIAL_COLLABORATORS: TeamMember\[\] = \[\]/);
  });

  it('the drawer does not seed every task with the same subtasks and comments', () => {
    const drawer = code('components/board/WorkItemDetailDrawer.tsx');
    expect(drawer).not.toMatch(/Review specifications & requirements/);
    expect(drawer).not.toMatch(/NEXORA Bot/);
  });
});

describe('Broken deep links recover (section 10)', () => {
  it('an unknown or denied project 404s instead of rendering the demo board', () => {
    const page = read('app/projects/[id]/page.tsx');
    expect(page).toContain('notFound()');
    expect(page).not.toMatch(/if \(fetchedProject\) \{\s*activeProject = fetchedProject;/);
  });

  it('sign out on the project page ends a real session', () => {
    expect(read('app/projects/[id]/page.tsx')).toContain('/api/auth/signout');
  });
});

describe('Navigation destinations match across platforms (section 6.4)', () => {
  it('the mobile dock and the rail expose the same four destinations', () => {
    const dock = read('components/navigation/SuperAppBottomBar.tsx');
    const sidebar = read('components/dashboard/Sidebar.tsx');

    // The dock's second slot used to be "Board", hard-navigating to a
    // hard-coded project UUID.
    expect(dock).not.toMatch(/d0000000-0000-4000-8000-000000000001/);
    expect(dock).not.toMatch(/window\.location\.href = `\/projects\//);
    expect(dock).toContain("onTabChange('projects')");

    for (const tab of ['overview', 'inbox', 'tasks', 'projects']) {
      expect(dock, `dock missing ${tab}`).toContain(`'${tab}'`);
      expect(sidebar, `rail missing ${tab}`).toContain(`'${tab}'`);
    }
  });
});

describe('A share link does not hijack a signed-in session', () => {
  it('only an anonymous visitor is given the demo cookie', () => {
    const route = read('app/s/[code]/route.ts');
    expect(route).toContain('signedIn');
    expect(route).toMatch(/if \(!signedIn\)/);
  });
});
