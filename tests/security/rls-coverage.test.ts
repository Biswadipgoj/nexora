import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * S4 — RLS Coverage Check (§15 & §51)
 * Requirement: Every table containing tenant data must have:
 * 1. RLS enabled
 * 2. RLS FORCED (applies even to table owner)
 * 3. workspace_id column
 * 4. with check clause on all UPDATE policies (blocks cross-tenant escalation per §12.4)
 * 
 * This test alone catches the most likely real-world regression:
 * someone adds a table and forgets the policy.
 */

describe('S4 — RLS Policy & Tenancy Coverage Check', () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

  const allSql = migrationFiles
    .map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf-8'))
    .join('\n');

  // Extract all table names from CREATE TABLE statements
  const createTableRegex = /create\s+table(?:\s+if\s+not\s+exists)?\s+([a-z0-9_]+)/gi;
  const createdTables: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = createTableRegex.exec(allSql)) !== null) {
    const tableName = match[1].toLowerCase();
    // Exclude partition tables or system tables if any
    if (!tableName.endsWith('_default') && !tableName.includes('partition')) {
      createdTables.push(tableName);
    }
  }

  // Non-tenant tables that are exempt from workspace_id
  const exemptWorkspaceIdTables = new Set(['workspaces', 'feature_flags']);

  it('must find migrations and created tables', () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
    expect(createdTables.length).toBeGreaterThan(5);
  });

  createdTables.forEach(tableName => {
    describe(`Table: ${tableName}`, () => {
      it('must have row level security enabled', () => {
        const enableRegex = new RegExp(
          `alter\\s+table\\s+${tableName}\\s+enable\\s+row\\s+level\\s+security`,
          'i'
        );
        expect(
          enableRegex.test(allSql),
          `Table "${tableName}" is missing: alter table ${tableName} enable row level security;`
        ).toBe(true);
      });

      it('must have row level security forced (force row level security)', () => {
        const forceRegex = new RegExp(
          `alter\\s+table\\s+${tableName}\\s+force\\s+row\\s+level\\s+security`,
          'i'
        );
        expect(
          forceRegex.test(allSql),
          `Table "${tableName}" is missing: alter table ${tableName} force row level security;`
        ).toBe(true);
      });

      if (!exemptWorkspaceIdTables.has(tableName)) {
        it('must carry workspace_id column per §11.1 conventions', () => {
          // Find the create table block for this table
          const tableBlockRegex = new RegExp(
            `create\\s+table\\s+${tableName}[^;]+;`,
            'is'
          );
          const tableBlock = allSql.match(tableBlockRegex)?.[0] ?? '';
          expect(
            tableBlock.includes('workspace_id'),
            `Table "${tableName}" is missing mandatory workspace_id column per §11.1`
          ).toBe(true);
        });
      }
    });
  });

  it('all UPDATE policies must include "with check" clause per §12.4', () => {
    // Split SQL into statements or find each create policy statement
    const policyBlocks = allSql.split(';').map(s => s.trim()).filter(s => /create\s+policy/i.test(s));
    const policiesWithoutWithCheck: string[] = [];

    for (const block of policyBlocks) {
      if (/for\s+update/i.test(block)) {
        const nameMatch = block.match(/create\s+policy\s+([a-z0-9_]+)\s+on\s+([a-z0-9_]+)/i);
        const hasWithCheck = /with\s+check\s*\(/i.test(block);

        if (nameMatch && !hasWithCheck) {
          policiesWithoutWithCheck.push(`${nameMatch[1]} on ${nameMatch[2]}`);
        }
      }
    }

    expect(
      policiesWithoutWithCheck,
      `Found UPDATE policies missing "with check" clause: ${policiesWithoutWithCheck.join(', ')}`
    ).toEqual([]);
  });
});
