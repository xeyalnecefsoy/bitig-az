type LogLevel = 'info' | 'warn' | 'error'

/**
 * Minimal structured logs for API routes (Vercel captures stdout).
 * Swap for Sentry/OpenTelemetry later without changing call sites.
 */
export function logApi(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta,
  }
  const text = JSON.stringify(line)
  if (level === 'error') console.error(text)
  else if (level === 'warn') console.warn(text)
  else console.log(text)
}
