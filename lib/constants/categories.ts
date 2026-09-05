export interface TaskCategory {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  {
    id: 'type-ui',
    name: 'UI / UX Design',
    shortName: 'UI Design',
    icon: '🎨',
    color: '#7c3aed', // Vibrant purple
    bgColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.28)',
    description: 'Design systems, wireframes, user experience, styling & visual polish',
  },
  {
    id: 'type-security',
    name: 'Security & Auth',
    shortName: 'Security',
    icon: '🛡️',
    color: '#dc2626', // Vibrant ruby
    bgColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.28)',
    description: 'Authentication, authorization, vulnerability patches, data encryption',
  },
  {
    id: 'type-feature',
    name: 'Feature & Product',
    shortName: 'Feature',
    icon: '⚡',
    color: '#2563eb', // Vibrant sapphire
    bgColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.28)',
    description: 'New product capabilities, user-facing features, enhancements',
  },
  {
    id: 'type-bug',
    name: 'Bug Fix',
    shortName: 'Bug',
    icon: '🐞',
    color: '#ea580c', // Vibrant amber-orange
    bgColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: 'rgba(234, 88, 12, 0.28)',
    description: 'Defect remediation, edge-case handling, error troubleshooting',
  },
  {
    id: 'type-backend',
    name: 'Backend & API',
    shortName: 'Backend',
    icon: '⚙️',
    color: '#0284c7', // Vibrant sky/cyan
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.28)',
    description: 'Database schema, REST/GraphQL endpoints, business logic & caching',
  },
  {
    id: 'type-infra',
    name: 'DevOps & Infra',
    shortName: 'DevOps',
    icon: '🚀',
    color: '#059669', // Vibrant emerald
    bgColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(5, 150, 105, 0.28)',
    description: 'CI/CD deployment, cloud hosting, monitoring, Docker/K8s',
  },
  {
    id: 'type-docs',
    name: 'Documentation',
    shortName: 'Docs',
    icon: '📄',
    color: '#d97706', // Vibrant amber
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.28)',
    description: 'User guides, developer API specs, onboarding docs, release notes',
  },
  {
    id: 'type-task',
    name: 'General Task',
    shortName: 'Task',
    icon: '📋',
    color: '#475569', // Slate
    bgColor: 'rgba(71, 85, 105, 0.12)',
    borderColor: 'rgba(71, 85, 105, 0.28)',
    description: 'Operational work, administrative review, research and chores',
  },
];

export function getCategoryByIdOrName(idOrName?: string): TaskCategory {
  if (!idOrName) return TASK_CATEGORIES[7]; // Default to General Task
  const lower = idOrName.toLowerCase().trim();

  // 1. Exact match by id
  const byId = TASK_CATEGORIES.find((c) => c.id.toLowerCase() === lower);
  if (byId) return byId;

  // 2. Keyword heuristic checks
  if (lower.includes('security') || lower.includes('auth') || lower.includes('token') || lower.includes('crypto')) {
    return TASK_CATEGORIES[1]; // Security
  }
  if (lower.includes('ui') || lower.includes('ux') || lower.includes('design') || lower.includes('style') || lower.includes('css') || lower.includes('layout')) {
    return TASK_CATEGORIES[0]; // UI Design
  }
  if (lower.includes('doc') || lower.includes('readme') || lower.includes('guide') || lower.includes('spec') || lower.includes('manual')) {
    return TASK_CATEGORIES[6]; // Documentation
  }
  if (lower.includes('bug') || lower.includes('fix') || lower.includes('defect') || lower.includes('error')) {
    return TASK_CATEGORIES[3]; // Bug
  }
  if (lower.includes('feature') || lower.includes('product') || lower.includes('epic') || lower.includes('story')) {
    return TASK_CATEGORIES[2]; // Feature
  }
  if (lower.includes('infra') || lower.includes('devops') || lower.includes('deploy') || lower.includes('docker') || lower.includes('k8s')) {
    return TASK_CATEGORIES[5]; // DevOps
  }
  if (lower.includes('backend') || lower.includes('api') || lower.includes('database') || lower.includes('sql') || lower.includes('server')) {
    return TASK_CATEGORIES[4]; // Backend
  }

  // 3. Match by name or shortName
  const byName = TASK_CATEGORIES.find(
    (c) => c.name.toLowerCase() === lower || c.shortName.toLowerCase() === lower
  );
  if (byName) return byName;

  return TASK_CATEGORIES[7]; // Fallback to General Task
}
