import yaml from 'js-yaml';

export const parseSpec = (raw: string | object): any => {
  if (typeof raw === 'object') return raw;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  return yaml.load(trimmed);
};

export const extractByDotPath = (obj: unknown, path?: string): unknown => {
  if (!path) return obj;
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, obj);
};
