const getByPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce((acc: unknown, key) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);

export function extractOutputs(
  response: { body?: unknown; headers?: Record<string, string> },
  extractions: Array<{ source: string; target: string }> = []
) {
  const updates: Record<string, unknown> = {};
  for (const extraction of extractions) {
    const value = extraction.source.startsWith('header.')
      ? response.headers?.[extraction.source.replace('header.', '').toLowerCase()]
      : getByPath({ body: response.body, header: response.headers }, extraction.source);
    if (value !== undefined) updates[extraction.target] = value;
  }
  return updates;
}
