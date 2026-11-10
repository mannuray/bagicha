/** The one place errors are reported. Console in development, silent in production for now. */
export function reportError(err: unknown, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error('[bagicha]', err, context ?? {});
  }
}
