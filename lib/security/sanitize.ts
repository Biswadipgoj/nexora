/**
 * Input sanitization utilities.
 * §13.5: Defence-in-depth — even though Supabase parameterizes queries,
 * we sanitize all user input at the application boundary.
 */

/**
 * Strip HTML tags from a string to prevent stored XSS.
 * Use this on user-provided text fields (names, descriptions, etc.).
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML entities for safe display.
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/**
 * Sanitize a slug — only allow lowercase alphanumeric and hyphens.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Validate and sanitize a redirect URL.
 * Prevents open redirect attacks by ensuring the URL is a relative path.
 * §13.10: Never redirect to external URLs from auth flows.
 */
export function sanitizeRedirectUrl(url: string, allowedPaths: string[] = ['/dashboard', '/onboarding']): string {
  // Must be a relative path (starts with /)
  if (!url.startsWith('/')) return '/dashboard';

  // Must not contain protocol-relative URLs (//)
  if (url.startsWith('//')) return '/dashboard';

  // Must not contain encoded characters that could bypass checks
  const decoded = decodeURIComponent(url);
  if (decoded.includes('//') || decoded.includes('\\')) return '/dashboard';

  // Extract the pathname (before query params)
  const pathname = url.split('?')[0] ?? url;

  // Check against allowlist of path prefixes
  const isAllowed = allowedPaths.some((allowed) => pathname.startsWith(allowed));
  if (!isAllowed) return '/dashboard';

  return url;
}

/**
 * Validate that a string is a valid UUID v4.
 * Defence-in-depth against injection via ID parameters.
 */
export function isValidUuid(input: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);
}

/**
 * Truncate a string to a safe length.
 * Prevents resource exhaustion from oversized inputs.
 */
export function safeTruncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength);
}
