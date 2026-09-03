/**
 * Workspace validation schemas.
 * §13.5: Validate on the server against an explicit schema.
 */

import { z } from 'zod';

export const workspaceSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    slug: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),
};

export const projectSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    key: z
      .string()
      .min(1)
      .max(10)
      .regex(/^[A-Z][A-Z0-9]*$/, 'Key must be uppercase alphanumeric, starting with a letter'),
    description: z.string().max(1000).optional(),
    workspace_id: z.string().uuid(),
    team_id: z.string().uuid().optional(),
    mode: z.enum(['simple', 'advanced']).default('simple'),
    is_personal: z.boolean().default(false),
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    mode: z.enum(['simple', 'advanced']).optional(),
    archived_at: z.string().datetime().optional().nullable(),
  }),
};

export const workItemSchemas = {
  create: z.object({
    workspace_id: z.string().uuid(),
    project_id: z.string().uuid(),
    type_id: z.string().uuid(),
    status_id: z.string().uuid(),
    title: z.string().min(1).max(500),
    description: z.record(z.string(), z.unknown()).optional(),
    priority: z.number().int().min(0).max(4).default(0),
    parent_id: z.string().uuid().optional(),
    team_id: z.string().uuid().optional(),
    start_date: z.string().date().optional(),
    due_date: z.string().date().optional(),
    estimate: z.number().positive().optional(),
    sprint_id: z.string().uuid().optional(),
    assignee_ids: z.array(z.string().uuid()).optional(),
    label_ids: z.array(z.string().uuid()).optional(),
  }),

  update: z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.record(z.string(), z.unknown()).optional().nullable(),
    status_id: z.string().uuid().optional(),
    priority: z.number().int().min(0).max(4).optional(),
    type_id: z.string().uuid().optional(),
    start_date: z.string().date().optional().nullable(),
    due_date: z.string().date().optional().nullable(),
    estimate: z.number().positive().optional().nullable(),
    position: z.number().optional(),
    sprint_id: z.string().uuid().optional().nullable(),
    parent_id: z.string().uuid().optional().nullable(),
    team_id: z.string().uuid().optional().nullable(),
  }),
};

export const commentSchemas = {
  create: z.object({
    workspace_id: z.string().uuid(),
    work_item_id: z.string().uuid(),
    body: z.record(z.string(), z.unknown()),
  }),

  update: z.object({
    body: z.record(z.string(), z.unknown()),
  }),
};

export const labelSchemas = {
  create: z.object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6B7280'),
  }),
};

export const teamSchemas = {
  create: z.object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1).max(100),
    key: z
      .string()
      .min(1)
      .max(10)
      .regex(/^[A-Z][A-Z0-9]*$/, 'Key must be uppercase alphanumeric'),
    description: z.string().max(500).optional(),
  }),
};
