import React from 'react';
import type { TaskCategory } from '@/lib/constants/categories';
import { categorySwatch, initials, priorityLabel } from '@/lib/work/display';

/** Priority as a three-step meter plus its word; urgent gets a solid mark. */
export function PriorityMark({ priority, showLabel = true }: { priority?: number; showLabel?: boolean }) {
  const level = priority ?? 0;
  const label = priorityLabel(level);

  return (
    <span className="nx-priority" data-level={level} title={label}>
      {level === 4 ? (
        <span className="nx-priority__urgent" aria-hidden="true">
          !
        </span>
      ) : (
        <span className="nx-priority__bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      )}
      {showLabel ? <span>{label}</span> : <span className="nx-visually-hidden">{label}</span>}
    </span>
  );
}

/** Category as a small square swatch and a short name. */
export function CategoryMark({ category }: { category: TaskCategory }) {
  return (
    <span className="nx-category" title={category.description}>
      <span className="nx-category__swatch" style={{ background: categorySwatch(category.id) }} aria-hidden="true" />
      {category.shortName}
    </span>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span className={`nx-avatar ${size === 'lg' ? 'nx-avatar--lg' : ''}`} title={name} aria-label={name}>
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  if (names.length === 0) return null;
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="nx-avatar-stack">
      {shown.map((name, i) => (
        <Avatar key={`${name}-${i}`} name={name} />
      ))}
      {rest > 0 && <span className="nx-avatar">+{rest}</span>}
    </span>
  );
}
