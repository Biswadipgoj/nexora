/** Project keys: 2–10 characters, uppercase letters and digits, starting with a letter. */
export const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

/**
 * Suggests a key from a project name: initials for several words, the first
 * three letters for one. Leading digits are dropped, since a key must start
 * with a letter — "3D Viewer" used to suggest "3V", which the API rejected.
 */
export function suggestProjectKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[0-9]+/, ''))
    .filter(Boolean);

  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 3);
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 4);
}

export function projectKeyError(key: string): string | undefined {
  if (!key) return undefined;
  if (!/^[A-Z]/.test(key)) return 'Start with a letter.';
  if (key.length < 2) return 'Use at least 2 characters.';
  if (!PROJECT_KEY_PATTERN.test(key)) return 'Letters and numbers only, up to 10.';
  return undefined;
}
