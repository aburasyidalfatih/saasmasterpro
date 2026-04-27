import { logger } from "@/lib/logger"

/**
 * Error Reporter — Abstraction layer for error reporting.
 *
 * In development, errors are logged via the structured logger.
 * In production, integrate with Sentry, LogTrap, Bugsnag, etc.
 *
 * Usage:
 *   import { reportError } from "@/lib/error-reporter"
 *   reportError(new Error("Something failed"), { userId: "...", action: "..." })
 */

interface ErrorContext {
  userId?: string
  tenantId?: string
  action?: string
  [key: string]: unknown
}

/**
 * Report an error to the configured error tracking service.
 * Always logs locally; optionally sends to external service in production.
 */
export function reportError(error: Error | unknown, context?: ErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error))

  logger.error(err.message, err, context)

  // === Production: uncomment and configure your error service ===
  // if (process.env.NODE_ENV === "production") {
  //   // Sentry example:
  //   // Sentry.captureException(err, { extra: context })
  //
  //   // Or generic webhook:
  //   // fetch(process.env.ERROR_WEBHOOK_URL, {
  //   //   method: "POST",
  //   //   headers: { "Content-Type": "application/json" },
  //   //   body: JSON.stringify({
  //   //     message: err.message,
  //   //     stack: err.stack,
  //   //     ...context,
  //   //     timestamp: new Date().toISOString(),
  //   //   }),
  //   // }).catch(() => {})
  // }
}

/**
 * Report a warning (non-fatal issue that should be tracked).
 */
export function reportWarning(message: string, context?: ErrorContext) {
  logger.warn(message, context)
}
