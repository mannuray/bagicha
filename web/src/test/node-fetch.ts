/**
 * Node's fetch can't stream jsdom's FormData (and MSW can't read a FormData body
 * built from Node Files under jsdom). So multipart bodies are serialized by hand —
 * the same bytes a browser sends — and real uploads still run in component tests.
 */
function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new TypeError('read failed'));
    reader.readAsArrayBuffer(blob);
  });
}

async function toMultipart(form: FormData): Promise<{ body: Uint8Array; contentType: string }> {
  const boundary = `----bagicha-test-${Math.random().toString(16).slice(2)}`;
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  for (const [name, value] of form.entries()) {
    if (typeof value === 'string') {
      parts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    } else {
      parts.push(
        encoder.encode(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${value.name}"\r\nContent-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
        ),
      );
      parts.push(await readBytes(value));
      parts.push(encoder.encode('\r\n'));
    }
  }
  parts.push(encoder.encode(`--${boundary}--\r\n`));
  const body = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    body.set(p, offset);
    offset += p.length;
  }
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

export const testFetch: typeof fetch = async (input, init) => {
  if (init?.body instanceof FormData) {
    const { body, contentType } = await toMultipart(init.body);
    const headers = new Headers(init.headers);
    headers.set('Content-Type', contentType);
    return fetch(input, { ...init, headers, body: body as unknown as BodyInit });
  }
  return fetch(input, init);
};
