import { extractByDotPath, parseSpec } from './parseSpec';
import { sanitizeHeaders } from '../utils/sanitize';
import type { Env } from '../types';

export async function fetchRemoteSpec(env: Env): Promise<any> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (env.SPEC_POST_HEADERS) {
    Object.assign(headers, JSON.parse(env.SPEC_POST_HEADERS));
  }
  headers[env.SPEC_API_KEY_HEADER ?? 'x-api-key'] = env.SPEC_API_KEY;
  if (env.SPEC_AUTH_HEADER) headers.authorization = env.SPEC_AUTH_HEADER;

  const response = await fetch(env.SPEC_POST_URL, {
    method: 'POST',
    headers,
    body: env.SPEC_POST_BODY ?? '{}'
  });

  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  const payload = contentType.includes('application/json') ? JSON.parse(text) : text;
  const extracted = extractByDotPath(payload, env.SPEC_RESPONSE_PATH);
  const candidate = extracted ?? payload;

  try {
    return parseSpec(candidate as string | object);
  } catch {
    throw new Error(`Unable to parse remote spec. Response headers=${JSON.stringify(sanitizeHeaders(response.headers))}`);
  }
}
