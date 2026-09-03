/**
 * CSRF protection using double-submit cookie pattern.
 * §13.9: All state-changing operations must carry a CSRF token.
 *
 * Flow:
 * 1. Server sets a CSRF token cookie (httpOnly=false so JS can read it)
 * 2. Client reads cookie and includes token in X-CSRF-Token header
 * 3. Server validates header matches cookie
 */

import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = '__nexora_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token.
 */
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token cookie. Call this on page loads.
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS to include in header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
  });
  return token;
}

/**
 * Validate CSRF token from request.
 * Compares the cookie value against the header value.
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!headerToken) return false;

  // Parse cookie manually since we're in Route Handler context
  const cookieToken = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split('=')[1];

  if (!cookieToken) return false;

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
