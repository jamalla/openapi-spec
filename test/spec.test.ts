import { describe, expect, it } from 'vitest';
import { extractByDotPath, parseSpec } from '../src/lib/spec/parseSpec';
import { validateSpec } from '../src/lib/spec/validateSpec';

describe('spec parsing', () => {
  it('parses yaml', () => {
    const spec = parseSpec('openapi: 3.0.0\npaths: {}');
    expect((spec as any).openapi).toBe('3.0.0');
  });

  it('extracts nested path', () => {
    expect(extractByDotPath({ data: { spec: { openapi: '3.0.0' } } }, 'data.spec')).toEqual({ openapi: '3.0.0' });
  });

  it('validates duplicate operationId', () => {
    const issues = validateSpec({
      openapi: '3.0.0',
      paths: {
        '/a': { get: { operationId: 'dup', responses: { '200': {} } } },
        '/b': { get: { operationId: 'dup', responses: { '200': {} } } }
      }
    });
    expect(issues.some((i) => i.code === 'duplicate_operation_id')).toBe(true);
  });
});
