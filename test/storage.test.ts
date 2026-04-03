import { describe, expect, it, vi } from 'vitest';
import { createRun } from '../src/lib/storage/d1';

describe('d1 helpers', () => {
  it('creates run via sql', async () => {
    const run = vi.fn().mockResolvedValue({});
    const bind = vi.fn().mockReturnValue({ run });
    const prepare = vi.fn().mockReturnValue({ bind });
    const env: any = { DB: { prepare } };

    await createRun(env, 'r1', { allowMutating: false });
    expect(prepare).toHaveBeenCalled();
    expect(run).toHaveBeenCalled();
  });
});
