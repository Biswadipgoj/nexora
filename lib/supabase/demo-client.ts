import { DEMO_COOKIE_NAME } from './config';

/** Browser-side check for the demo session cookie (it is not httpOnly). */
export function hasDemoCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim() === `${DEMO_COOKIE_NAME}=true`);
}
