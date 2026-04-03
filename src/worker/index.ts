import { app } from './routes';
import { executeValidationRun } from '../lib/workflow/validationWorkflow';
import type { Env } from '../lib/types';

export class ValidationWorkflow {
  async run(event: { payload: { runId: string } }, env: Env) {
    await executeValidationRun(env, event.payload.runId);
  }
}

export default app;
