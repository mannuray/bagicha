/**
 * What auto-instrumented spans may carry. Spans leave the box when a collector is
 * set, so they follow the logging rules: no personal data, no query strings.
 */

/** Redis spans: the command only (keys and arguments carry job data and hashed ids). */
export function redisStatement(cmdName: string, _args?: unknown[]): string {
  return cmdName;
}

/** Incoming HTTP spans: keep the path, drop the query string and the client address. */
export function redactIncomingHttpSpan(
  span: { setAttribute: (key: string, value: string) => unknown },
  request: { url?: string },
): void {
  const path = (request.url ?? '').split('?')[0];
  span.setAttribute('http.target', path);
  span.setAttribute('url.query', '');
  span.setAttribute('http.client_ip', '');
  span.setAttribute('client.address', '');
  span.setAttribute('net.peer.ip', '');
  span.setAttribute('network.peer.address', '');
}
