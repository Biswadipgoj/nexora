/**
 * Background job handlers.
 * §18.4: Every background job must be idempotent, retryable with
 * exponential backoff and jitter, dead-lettered after bounded retry count,
 * monitored, and carry originating workspace+user context.
 */
