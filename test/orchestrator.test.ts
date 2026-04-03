import { describe, expect, it } from 'vitest';
import { bindContext } from '../src/lib/orchestrator/bindContext';
import { extractOutputs } from '../src/lib/orchestrator/extractOutputs';
import { runScenario } from '../src/lib/orchestrator/runScenario';

describe('orchestrator', () => {
  it('binds context', () => {
    const req = bindContext({ body: {} }, [{ target: 'body.category_id', source: 'category_id' }], { category_id: 'cat_1' });
    expect((req.body as any).category_id).toBe('cat_1');
  });

  it('extracts outputs', () => {
    const out = extractOutputs({ body: { data: { id: 'p_1' } }, headers: {} }, [{ source: 'body.data.id', target: 'product_id' }]);
    expect(out.product_id).toBe('p_1');
  });

  it('propagates dependency blocks', async () => {
    const scenario = {
      name: 'x',
      orderIndex: 1,
      steps: [
        { stepKey: 'a', operation: { method: 'POST', path: '/a' }, executionMode: 'LIVE_SCHEMA_CHECK' },
        { stepKey: 'b', operation: { method: 'POST', path: '/b' }, executionMode: 'LIVE_SCHEMA_CHECK_WITH_DEPENDENCIES', dependsOn: ['a'] }
      ]
    } as any;

    const result = await runScenario(
      scenario,
      async (step) => ({ status: step.stepKey === 'a' ? 'FAILED' : 'PASSED', issues: [] }),
      {}
    );

    expect(result.stepResults[1].status).toBe('BLOCKED_BY_DEPENDENCY');
  });
});
