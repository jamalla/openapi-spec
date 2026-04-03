import { safeKey } from '../utils/sanitize';
import type { Env } from '../types';

export function runKey(runId: string, category: 'summary' | 'issues' | 'artifacts', fileName: string) {
  return `runs/${safeKey(runId)}/${category}/${safeKey(fileName)}`;
}

export async function putText(env: Env, key: string, content: string, contentType = 'text/markdown') {
  await env.ARTIFACTS.put(key, content, { httpMetadata: { contentType } });
  return key;
}

export async function getText(env: Env, key: string): Promise<string | null> {
  const obj = await env.ARTIFACTS.get(key);
  if (!obj) return null;
  return obj.text();
}
