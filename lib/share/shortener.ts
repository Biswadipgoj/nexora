/**
 * Built-in URL Shortener & Share Link Registry for NEXORA Projects.
 * Enables instant project sharing and 1-click collaborator invitations.
 */

export interface ShortLink {
  code: string;
  projectId: string;
  workspaceId: string;
  targetUrl: string;
  role: 'viewer' | 'contributor' | 'admin';
  createdAt: string;
  clicks: number;
}

// In-memory registry with persistent initial demo short links
const shortLinksMap = new Map<string, ShortLink>([
  [
    'app',
    {
      code: 'app',
      projectId: 'c0000000-0000-4000-8000-000000000001',
      workspaceId: 'b0000000-0000-4000-8000-000000000001',
      targetUrl: '/projects/c0000000-0000-4000-8000-000000000001',
      role: 'contributor',
      createdAt: new Date().toISOString(),
      clicks: 14,
    },
  ],
  [
    'mobile-demo',
    {
      code: 'mobile-demo',
      projectId: 'c0000000-0000-4000-8000-000000000001',
      workspaceId: 'b0000000-0000-4000-8000-000000000001',
      targetUrl: '/projects/c0000000-0000-4000-8000-000000000001',
      role: 'contributor',
      createdAt: new Date().toISOString(),
      clicks: 8,
    },
  ],
]);

function generateRandomSlug(length = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getShortLink(code: string): ShortLink | undefined {
  const normalized = code.toLowerCase().trim();
  const link = shortLinksMap.get(normalized);
  if (link) {
    link.clicks += 1;
  }
  return link;
}

export function createShortLink(params: {
  projectId: string;
  workspaceId?: string;
  customAlias?: string;
  role?: 'viewer' | 'contributor' | 'admin';
}): ShortLink {
  const rawCode = params.customAlias?.trim()
    ? params.customAlias.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '')
    : generateRandomSlug(6);

  const code = rawCode || generateRandomSlug(6);

  const link: ShortLink = {
    code,
    projectId: params.projectId,
    workspaceId: params.workspaceId || 'b0000000-0000-4000-8000-000000000001',
    targetUrl: `/projects/${params.projectId}`,
    role: params.role || 'contributor',
    createdAt: new Date().toISOString(),
    clicks: 0,
  };

  shortLinksMap.set(code, link);
  return link;
}

export function listShortLinks(projectId: string): ShortLink[] {
  const links: ShortLink[] = [];
  shortLinksMap.forEach((link) => {
    if (link.projectId === projectId) {
      links.push({ ...link });
    }
  });
  return links;
}
