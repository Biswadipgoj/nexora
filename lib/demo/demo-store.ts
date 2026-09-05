/**
 * In-memory demo data store for instant mock login and interactive demo testing.
 * Provides realistic project, workspace, and Kanban work-item data.
 */

export const DEMO_USER = {
  id: 'a0000000-0000-4000-8000-000000000001',
  email: 'demo@nexora.io',
  user_metadata: {
    full_name: 'Alex Morgan',
    avatar_url: '',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export const DEMO_WORKSPACE = {
  id: 'b0000000-0000-4000-8000-000000000001',
  name: 'Acme Mobile',
  slug: 'acme-mobile',
  is_personal: false,
  plan: 'pro',
  owner_id: DEMO_USER.id,
  created_at: new Date().toISOString(),
};

export const DEMO_PROJECT = {
  id: 'c0000000-0000-4000-8000-000000000001',
  workspace_id: DEMO_WORKSPACE.id,
  name: 'Mobile App',
  key: 'APP',
  description: 'Next-generation mobile client for iOS and Android.',
  mode: 'simple' as const,
  is_personal: false,
  item_counter: 105,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_STATUSES = [
  { id: 'status-todo', name: 'To Do', category: 'todo', position: 0, color: '#6366F1' },
  { id: 'status-in-progress', name: 'In Progress', category: 'in_progress', position: 1, color: '#8B5CF6' },
  { id: 'status-done', name: 'Done', category: 'done', position: 2, color: '#10B981' },
];

import { TASK_CATEGORIES } from '@/lib/constants/categories';

export const DEMO_TYPES = TASK_CATEGORIES.map((cat) => ({
  id: cat.id,
  name: cat.name,
}));

export interface WorkItemComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
}

export interface DemoWorkItem {
  id: string;
  workspace_id: string;
  project_id: string;
  sequence: number;
  title: string;
  priority: number;
  status_id: string;
  type_id: string;
  due_date: string | null;
  start_date?: string | null;
  position: number;
  story_points?: number;
  epic_name?: string;
  epic_color?: string;
  assignee?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  assignees?: Array<{
    name: string;
    avatar?: string;
    role?: string;
  }> | null;
  comments?: WorkItemComment[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const INITIAL_WORK_ITEMS: DemoWorkItem[] = [
  {
    id: 'f0000000-0000-4000-8000-000000000104',
    workspace_id: DEMO_WORKSPACE.id,
    project_id: DEMO_PROJECT.id,
    sequence: 104,
    title: 'Stripe checkout integration',
    priority: 3, // High
    status_id: DEMO_STATUSES[1].id, // In Progress
    type_id: DEMO_TYPES[1].id, // Feature
    due_date: '2026-09-11',
    start_date: '2026-09-01',
    position: 0,
    story_points: 5,
    epic_name: 'Checkout v2',
    epic_color: '#8B5CF6',
    assignee: {
      name: 'Alex Morgan',
      avatar: '/avatars/avatar_alex.jpg',
      role: 'Tech Lead',
    },
    assignees: [
      {
        name: 'Alex Morgan',
        avatar: '/avatars/avatar_alex.jpg',
        role: 'Tech Lead',
      },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Sarah Chen',
        avatar: '',
        text: 'Added the Apple Pay and Google Pay sheet specs into the Figma branch.',
        createdAt: '2 hours ago',
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'f0000000-0000-4000-8000-000000000098',
    workspace_id: DEMO_WORKSPACE.id,
    project_id: DEMO_PROJECT.id,
    sequence: 98,
    title: 'Profile photo upload & cropping',
    priority: 2, // Medium
    status_id: DEMO_STATUSES[1].id, // In Progress
    type_id: 'type-ui', // UI / UX Design
    due_date: '2026-09-08',
    start_date: '2026-09-03',
    position: 1,
    story_points: 3,
    epic_name: 'Mobile Design System',
    epic_color: '#EC4899',
    assignee: {
      name: 'Sarah Chen',
      avatar: '/avatars/avatar_sarah.jpg',
      role: 'Product Designer',
    },
    assignees: [
      {
        name: 'Sarah Chen',
        avatar: '/avatars/avatar_sarah.jpg',
        role: 'Product Designer',
      },
    ],
    comments: [
      {
        id: 'c2',
        author: 'Alex Morgan',
        avatar: '',
        text: 'Client side canvas compression is hooked up and ready for review.',
        createdAt: 'Yesterday',
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'f0000000-0000-4000-8000-000000000101',
    workspace_id: DEMO_WORKSPACE.id,
    project_id: DEMO_PROJECT.id,
    sequence: 101,
    title: 'Biometric authentication on Android',
    priority: 3, // High
    status_id: DEMO_STATUSES[0].id, // To Do
    type_id: 'type-security', // Security & Auth
    due_date: '2026-09-18',
    start_date: '2026-09-10',
    position: 0,
    story_points: 8,
    epic_name: 'Identity & Security',
    epic_color: '#10B981',
    assignee: {
      name: 'Alex Morgan',
      avatar: '/avatars/avatar_alex.jpg',
      role: 'Tech Lead',
    },
    assignees: [
      {
        name: 'Alex Morgan',
        avatar: '/avatars/avatar_alex.jpg',
        role: 'Tech Lead',
      },
    ],
    comments: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'f0000000-0000-4000-8000-000000000102',
    workspace_id: DEMO_WORKSPACE.id,
    project_id: DEMO_PROJECT.id,
    sequence: 102,
    title: 'Push notification deep linking',
    priority: 2, // Medium
    status_id: DEMO_STATUSES[0].id, // To Do
    type_id: 'type-backend', // Backend & API
    due_date: '2026-09-15',
    start_date: '2026-09-08',
    position: 1,
    story_points: 3,
    epic_name: 'Core Infrastructure',
    epic_color: '#0EA5E9',
    assignee: {
      name: 'Sarah Chen',
      avatar: '/avatars/avatar_sarah.jpg',
      role: 'Product Designer',
    },
    assignees: [
      {
        name: 'Sarah Chen',
        avatar: '/avatars/avatar_sarah.jpg',
        role: 'Product Designer',
      },
    ],
    comments: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'f0000000-0000-4000-8000-000000000091',
    workspace_id: DEMO_WORKSPACE.id,
    project_id: DEMO_PROJECT.id,
    sequence: 91,
    title: 'Fix login redirect loop on expired refresh token',
    priority: 4, // Urgent
    status_id: DEMO_STATUSES[2].id, // Done
    type_id: 'type-bug', // Bug Fix
    due_date: '2026-09-04',
    start_date: '2026-09-02',
    position: 0,
    story_points: 2,
    epic_name: 'Identity & Security',
    epic_color: '#10B981',
    assignee: {
      name: 'Alex Morgan',
      avatar: '/avatars/avatar_alex.jpg',
      role: 'Tech Lead',
    },
    assignees: [
      {
        name: 'Alex Morgan',
        avatar: '/avatars/avatar_alex.jpg',
        role: 'Tech Lead',
      },
    ],
    comments: [
      {
        id: 'c3',
        author: 'Alex Morgan',
        avatar: '/avatars/avatar_alex.jpg',
        text: 'Merged hotfix PR #418 into main and verified in staging.',
        createdAt: '3 days ago',
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'f0000000-0000-4000-8000-000000000095',
    workspace_id: DEMO_WORKSPACE.id,
    project_id: DEMO_PROJECT.id,
    sequence: 95,
    title: 'Luminous light theme color token alignment',
    priority: 1, // Low
    status_id: DEMO_STATUSES[2].id, // Done
    type_id: 'type-ui', // UI / UX Design
    due_date: '2026-09-03',
    start_date: '2026-08-30',
    position: 1,
    story_points: 2,
    epic_name: 'Mobile Design System',
    epic_color: '#EC4899',
    assignee: {
      name: 'Sarah Chen',
      avatar: '/avatars/avatar_sarah.jpg',
      role: 'Product Designer',
    },
    assignees: [
      {
        name: 'Sarah Chen',
        avatar: '/avatars/avatar_sarah.jpg',
        role: 'Product Designer',
      },
    ],
    comments: [],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

// Persistent across requests in Node process memory
let demoItems: DemoWorkItem[] = [...INITIAL_WORK_ITEMS];
let currentCounter = 105;

export function getDemoWorkItems(projectId?: string, statusId?: string): DemoWorkItem[] {
  return demoItems.filter((item) => {
    if (item.deleted_at !== null) return false;
    if (projectId && item.project_id !== projectId && projectId !== 'default-workspace') {
      // Allow general demo project match
    }
    if (statusId && item.status_id !== statusId) return false;
    return true;
  });
}

export function getDemoWorkItem(id: string): DemoWorkItem | undefined {
  return demoItems.find((it) => it.id === id && it.deleted_at === null);
}

export function createDemoWorkItem(input: {
  workspace_id: string;
  project_id: string;
  type_id: string;
  status_id: string;
  title: string;
  priority?: number;
  due_date?: string | null;
  assignees?: Array<{ name: string; avatar?: string; role?: string }>;
}): DemoWorkItem {
  currentCounter += 1;
  const assigneesList = input.assignees?.map((a) => ({
    name: a.name,
    avatar: a.avatar || '',
    role: a.role || 'Member',
  })) || [];

  const newItem: DemoWorkItem = {
    id: `f0000000-0000-4000-8000-${String(Date.now()).slice(-12).padStart(12, '0')}`,
    workspace_id: input.workspace_id || DEMO_WORKSPACE.id,
    project_id: input.project_id || DEMO_PROJECT.id,
    sequence: currentCounter,
    title: input.title,
    priority: input.priority ?? 0,
    status_id: input.status_id || DEMO_STATUSES[0].id,
    type_id: input.type_id || DEMO_TYPES[0].id,
    due_date: input.due_date || null,
    position: demoItems.length,
    assignees: assigneesList,
    assignee: assigneesList.length > 0 ? assigneesList[0] : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  demoItems.push(newItem);
  return newItem;
}

export function updateDemoWorkItem(
  id: string,
  updates: Partial<Omit<DemoWorkItem, 'id' | 'workspace_id' | 'project_id' | 'sequence'>>
): DemoWorkItem | null {
  const index = demoItems.findIndex((it) => it.id === id);
  if (index === -1) return null;

  const current = demoItems[index];
  const newAssignees = updates.assignees !== undefined ? updates.assignees : current.assignees;
  const newAssignee = updates.assignees !== undefined && updates.assignees && updates.assignees.length > 0
    ? updates.assignees[0]
    : updates.assignee !== undefined
    ? updates.assignee
    : current.assignee;

  demoItems[index] = {
    ...current,
    ...updates,
    assignees: newAssignees,
    assignee: newAssignee,
    updated_at: new Date().toISOString(),
  };

  return demoItems[index];
}

export function softDeleteDemoWorkItem(id: string): boolean {
  const item = demoItems.find((it) => it.id === id);
  if (!item) return false;
  item.deleted_at = new Date().toISOString();
  return true;
}

export function restoreDemoWorkItem(id: string): boolean {
  const item = demoItems.find((it) => it.id === id);
  if (!item) return false;
  item.deleted_at = null;
  return true;
}

export function resetDemoStore(): void {
  demoItems = [...INITIAL_WORK_ITEMS];
  currentCounter = 105;
}
