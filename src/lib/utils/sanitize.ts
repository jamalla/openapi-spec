const SENSITIVE_KEYS = ['authorization', 'x-api-key', 'api-key', 'token', 'password', 'secret'];

export function sanitizeHeaders(headers: Headers | Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const entries = headers instanceof Headers ? Array.from(headers.entries()) : Object.entries(headers);
  for (const [k, v] of entries) {
    out[k] = SENSITIVE_KEYS.some((key) => k.toLowerCase().includes(key)) ? '***REDACTED***' : v;
  }
  return out;
}

export function sanitizeBody(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(sanitizeBody);
  const clone: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    clone[k] = SENSITIVE_KEYS.some((key) => k.toLowerCase().includes(key)) ? '***REDACTED***' : sanitizeBody(v);
  }
  return clone;
}

export const safeKey = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
