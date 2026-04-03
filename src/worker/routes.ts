import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import type { Env, RunCreateInput } from '../lib/types';
import { createRun, getRun, getRunProgress, getRunResults, listRuns } from '../lib/storage/d1';
import { executeValidationRun } from '../lib/workflow/validationWorkflow';
import { buildCsvExport } from '../lib/reporting/buildCsvExport';
import { getText } from '../lib/storage/r2';

export const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) => c.json({ ok: true }));

app.post('/api/runs', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<RunCreateInput>;
  const runId = uuidv4();
  await createRun(c.env, runId, {
    label: body.label,
    notes: body.notes,
    allowMutating: body.allowMutating ?? false,
    includeOperations: body.includeOperations,
    excludeOperations: body.excludeOperations,
    dryRun: body.dryRun
  });

  if (c.env.VALIDATION_WORKFLOW?.create) {
    c.executionCtx.waitUntil(c.env.VALIDATION_WORKFLOW.create({ id: runId, params: { runId } }));
  } else {
    c.executionCtx.waitUntil(executeValidationRun(c.env, runId));
  }

  return c.json({ runId, status: 'PENDING' }, 202);
});

app.get('/api/runs', async (c) => {
  const status = c.req.query('status');
  return c.json({ runs: await listRuns(c.env, status) });
});

app.get('/api/runs/:id', async (c) => {
  const run = await getRun(c.env, c.req.param('id'));
  if (!run) return c.json({ error: 'Run not found' }, 404);
  return c.json(run);
});

app.get('/api/runs/:id/progress', async (c) => c.json(await getRunProgress(c.env, c.req.param('id'))));
app.get('/api/runs/:id/results', async (c) => c.json({ rows: await getRunResults(c.env, c.req.param('id')) }));

app.get('/api/runs/:id/report', async (c) => {
  const run = await getRun(c.env, c.req.param('id'));
  if (!run?.summary_report_r2_key) return c.text('No report', 404);
  const text = await getText(c.env, String(run.summary_report_r2_key));
  return c.text(text ?? 'Not found', text ? 200 : 404, { 'content-type': 'text/markdown; charset=utf-8' });
});

app.get('/api/runs/:id/issues/:issueKey', async (c) => {
  const key = `runs/${c.req.param('id')}/issues/${c.req.param('issueKey')}`;
  const text = await getText(c.env, key);
  return c.text(text ?? 'Not found', text ? 200 : 404, { 'content-type': 'text/markdown; charset=utf-8' });
});

app.get('/api/runs/:id/export.csv', async (c) => {
  const rows = (await getRunResults(c.env, c.req.param('id'))) as Array<Record<string, unknown>>;
  const csv = buildCsvExport(rows.map((r) => ({ ...r, run_id: c.req.param('id') })));
  c.header('content-type', 'text/csv; charset=utf-8');
  c.header('content-disposition', `attachment; filename="run-${c.req.param('id')}.csv"`);
  return c.body(csv);
});

app.get('*', async (c) => c.env.ASSETS.fetch(c.req.raw));
