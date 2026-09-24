/**
 * Short relative time for activity rows: "just now", "12m", "3h", "2d", or a
 * date once it is more than a week old. Accepts ISO strings or already
 * formatted labels (the demo seed data), which are returned unchanged.
 */
export function formatRelative(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
