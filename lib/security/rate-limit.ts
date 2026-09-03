/**
 * In-memory sliding-window rate limiter.
 * §13.8: Rate limiting on all auth and state-changing endpoints.
 *
 * Uses a Map-based store. In production with multiple instances,
 * replace with Redis-backed implementation.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export const RATE_LIMITS = {
  /** Login: 5 attempts / 15 minutes per IP */
  login: { maxRequests: 5, windowSeconds: 15 * 60 } satisfies RateLimitConfig,
  /** Signup: 3 attempts / hour per IP */
  signup: { maxRequests: 3, windowSeconds: 60 * 60 } satisfies RateLimitConfig,
  /** Password reset: 3 attempts / hour per email */
  passwordReset: { maxRequests: 3, windowSeconds: 60 * 60 } satisfies RateLimitConfig,
  /** General API: 60 requests / minute per user */
  api: { maxRequests: 60, windowSeconds: 60 } satisfies RateLimitConfig,
} as const;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (e.g., `login:${ip}` or `api:${userId}`)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or window expired — allow and start new window
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Within window — check count
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment and allow
  entry.count += 1;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get rate limit headers for the response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
