import type { Env, RunCreateInput, RunPhase, RunStatus, StepIssue } from '../types';
import { nowIso } from '../utils/progress';

export async function createRun(env: Env, id: string, input: RunCreateInput) {
  await env.DB.prepare(
    `INSERT INTO runs (id, label, status, phase, created_at, total_operations, generation_readiness)
     VALUES (?1, ?2, 'PENDING', 'INITIALIZING', ?3, 0, 'NOT_READY')`
  )
    .bind(id, input.label ?? null, nowIso())
    .run();
}

export async function updateRunStatus(env: Env, runId: string, status: RunStatus, phase: RunPhase, errorMessage?: string) {
  await env.DB.prepare(
    `UPDATE runs SET status = ?1, phase = ?2,
      started_at = CASE WHEN started_at IS NULL AND ?1 = 'RUNNING' THEN ?3 ELSE started_at END,
      finished_at = CASE WHEN ?1 IN ('SUCCEEDED','FAILED') THEN ?3 ELSE finished_at END,
      error_message = COALESCE(?4, error_message)
     WHERE id = ?5`
  )
    .bind(status, phase, nowIso(), errorMessage ?? null, runId)
    .run();
}

export async function appendEvent(env: Env, runId: string, level: string, phase: string, message: string) {
  await env.DB.prepare(`INSERT INTO run_events (run_id, timestamp, level, phase, message) VALUES (?1, ?2, ?3, ?4, ?5)`)
    .bind(runId, nowIso(), level, phase, message)
    .run();
}

export async function listRuns(env: Env, status?: string) {
  const query = status
    ? env.DB.prepare('SELECT * FROM runs WHERE status = ?1 ORDER BY created_at DESC').bind(status)
    : env.DB.prepare('SELECT * FROM runs ORDER BY created_at DESC');
  return (await query.all()).results;
}

export async function getRun(env: Env, runId: string) {
  return (await env.DB.prepare('SELECT * FROM runs WHERE id = ?1').bind(runId).first()) as Record<string, unknown> | null;
}

export async function getRunProgress(env: Env, runId: string) {
  const run = await getRun(env, runId);
  const events = (await env.DB.prepare('SELECT * FROM run_events WHERE run_id = ?1 ORDER BY timestamp DESC LIMIT 30').bind(runId).all()).results;
  return { run, events };
}

export async function createScenario(env: Env, scenario: { id: string; runId: string; name: string; orderIndex: number }) {
  await env.DB.prepare(
    'INSERT INTO scenarios (id, run_id, name, status, order_index, started_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
  )
    .bind(scenario.id, scenario.runId, scenario.name, 'RUNNING', scenario.orderIndex, nowIso())
    .run();
}

export async function finishScenario(env: Env, scenarioId: string, status: string) {
  await env.DB.prepare('UPDATE scenarios SET status = ?1, finished_at = ?2 WHERE id = ?3').bind(status, nowIso(), scenarioId).run();
}

export async function createStep(env: Env, step: Record<string, unknown>) {
  await env.DB.prepare(
    `INSERT INTO scenario_steps (
      id, scenario_id, step_key, method, path, operation_id, execution_mode, status, dependency_status,
      endpoint_score, openapi3_compatibility_score, generation_readiness, issue_count,
      issue_markdown_r2_key, request_artifact_r2_key, response_artifact_r2_key, diff_artifact_r2_key
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)`
  )
    .bind(
      step.id,
      step.scenario_id,
      step.step_key,
      step.method,
      step.path,
      step.operation_id ?? null,
      step.execution_mode,
      step.status,
      step.dependency_status ?? null,
      step.endpoint_score ?? 0,
      step.openapi3_compatibility_score ?? 0,
      step.generation_readiness ?? 'NOT_READY',
      step.issue_count ?? 0,
      step.issue_markdown_r2_key ?? null,
      step.request_artifact_r2_key ?? null,
      step.response_artifact_r2_key ?? null,
      step.diff_artifact_r2_key ?? null
    )
    .run();
}

export async function insertIssues(env: Env, issues: StepIssue[]) {
  for (const issue of issues) {
    await env.DB.prepare(
      `INSERT INTO step_issues (id, scenario_step_id, code, severity, title, message, likely_source, blocking_for_generation)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    )
      .bind(issue.id, issue.scenarioStepId, issue.code, issue.severity, issue.title, issue.message, issue.likelySource, issue.blockingForGeneration ? 1 : 0)
      .run();
  }
}

export async function getRunResults(env: Env, runId: string) {
  const rows = await env.DB.prepare(
    `SELECT s.name as scenario, st.*, 
            GROUP_CONCAT(i.code) as issue_codes, 
            MAX(i.severity) as severity,
            MAX(i.likely_source) as likely_source
      FROM scenario_steps st
      JOIN scenarios s ON s.id = st.scenario_id
      LEFT JOIN step_issues i ON i.scenario_step_id = st.id
      WHERE s.run_id = ?1
      GROUP BY st.id
      ORDER BY s.order_index, st.step_key`
  )
    .bind(runId)
    .all();
  return rows.results;
}
