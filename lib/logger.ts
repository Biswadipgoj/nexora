/**
 * Structured Logger for NEXORA.
 * §21: JSON, never free-text.
 * Every entry carries: timestamp, level, request_id, user_id, workspace_id, action, duration_ms, outcome.
 * §13.7 & §21: NEVER carries tokens, passwords, full request bodies or PII beyond identifiers.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  request_id?: string;
  user_id?: string;
  workspace_id?: string;
  action?: string;
  duration_ms?: number;
  outcome?: 'success' | 'failure' | 'error' | 'throttled' | 'denied';
  [key: string]: unknown;
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'api_key',
  'cookie',
  'session',
  'credit_card',
  'ssn',
]);

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMeta(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export class Logger {
  private service: string;

  constructor(service = 'nexora-app') {
    this.service = service;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const { request_id, user_id, workspace_id, action, duration_ms, outcome, ...extra } = context ?? {};

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      request_id,
      user_id,
      workspace_id,
      action,
      duration_ms,
      outcome,
      metadata: sanitizeMeta(extra),
    };

    const serialized = JSON.stringify(payload);

    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
