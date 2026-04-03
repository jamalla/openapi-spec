function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split('.');
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    if (!current[segments[i]] || typeof current[segments[i]] !== 'object') current[segments[i]] = {};
    current = current[segments[i]] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
}

export function bindContext(request: Record<string, unknown>, bindings: Array<{ target: string; source: string }> = [], context: Record<string, unknown>) {
  const copy = structuredClone(request);
  for (const binding of bindings) {
    const [bucket, ...rest] = binding.target.split('.');
    if (!['body', 'query', 'path', 'header'].includes(bucket)) continue;
    const value = context[binding.source];
    if (value !== undefined) setNested(copy, [bucket, ...rest].join('.'), value);
  }
  return copy;
}
