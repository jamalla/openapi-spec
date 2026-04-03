import { fetchRemoteSpec } from '../spec/fetchSpec';
import { validateSpec } from '../spec/validateSpec';
import { loadScenarios } from '../scenarios/loadScenarios';
import { runScenario } from '../orchestrator/runScenario';
import { compareResponse } from '../validation/compareResponse';
import { scoreStep } from '../validation/scoreStep';
import { scoreRun } from '../validation/scoreRun';
import { buildIssueMarkdown } from '../reporting/buildIssueMarkdown';
import { buildRunSummaryMarkdown } from '../reporting/buildRunSummaryMarkdown';
import { appendEvent, createScenario, createStep, finishScenario, insertIssues, updateRunStatus } from '../storage/d1';
import { putText, runKey } from '../storage/r2';
import type { Env, StepIssue } from '../types';

export async function executeValidationRun(env: Env, runId: string) {
  await updateRunStatus(env, runId, 'RUNNING', 'FETCHING_SPEC');
  await appendEvent(env, runId, 'INFO', 'FETCHING_SPEC', 'Fetching remote manual OpenAPI spec');

  const spec = await fetchRemoteSpec(env);
  const staticIssues = validateSpec(spec);

  await updateRunStatus(env, runId, 'RUNNING', 'ORCHESTRATING');
  const scenarios = loadScenarios();
  const context: Record<string, unknown> = {};
  const allStepRows: any[] = [];
  const allIssues: StepIssue[] = [...staticIssues];

  for (const scenario of scenarios) {
    const scenarioId = crypto.randomUUID();
    await createScenario(env, { id: scenarioId, runId, name: scenario.name, orderIndex: scenario.orderIndex });

    const result = await runScenario(
      scenario,
      async (step, request) => {
        const url = `${env.TARGET_API_BASE_URL}${step.operation.path}`;
        const response = await fetch(url, {
          method: step.operation.method,
          headers: { 'content-type': 'application/json' },
          body: ['GET', 'HEAD'].includes(step.operation.method) ? undefined : JSON.stringify((request.body as object) ?? {})
        });
        const bodyText = await response.text();
        const contentType = response.headers.get('content-type') ?? '';
        const responseBody = contentType.includes('application/json') ? JSON.parse(bodyText || '{}') : bodyText;
        const issues = compareResponse({
          expectedStatusCodes: [200, 201],
          expectedContentTypes: ['application/json'],
          actualStatus: response.status,
          actualContentType: contentType,
          body: responseBody,
          scenarioStepId: step.stepKey
        });

        return {
          status: issues.length ? 'FAILED' : 'PASSED',
          issues,
          response: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody
          }
        };
      },
      context
    );

    for (const row of result.stepResults as any[]) {
      const stepId = crypto.randomUUID();
      const stepIssues: StepIssue[] = (row.issues ?? []).map((i: StepIssue) => ({ ...i, id: crypto.randomUUID(), scenarioStepId: stepId }));
      const score = scoreStep(stepIssues);
      allIssues.push(...stepIssues);

      let issueMarkdownKey: string | null = null;
      if (stepIssues.length > 0 || row.status === 'BLOCKED_BY_DEPENDENCY') {
        const markdown = buildIssueMarkdown({
          scenario: scenario.name,
          stepKey: row.stepKey,
          method: row.method ?? 'UNKNOWN',
          path: row.path ?? 'UNKNOWN',
          executionMode: row.executionMode ?? 'LIVE_SCHEMA_CHECK',
          status: row.status,
          endpointScore: score.endpointScore,
          compatibilityScore: score.compatibilityScore,
          issues: stepIssues,
          expected: { statusCodes: [200, 201], contentType: 'application/json' },
          actual: row.response ?? {},
          dependencyContext: context,
          recommendation: 'Fix spec or production drift and rerun certification.'
        });
        issueMarkdownKey = await putText(env, runKey(runId, 'issues', `${row.method}_${row.path}_${row.stepKey}.md`), markdown);
      }

      await createStep(env, {
        id: stepId,
        scenario_id: scenarioId,
        step_key: row.stepKey,
        method: row.method ?? 'UNKNOWN',
        path: row.path ?? 'UNKNOWN',
        operation_id: row.operationId ?? null,
        execution_mode: row.executionMode ?? 'LIVE_SCHEMA_CHECK',
        status: row.status,
        dependency_status: row.dependency ?? null,
        endpoint_score: score.endpointScore,
        openapi3_compatibility_score: score.compatibilityScore,
        generation_readiness: score.generationReadiness,
        issue_count: stepIssues.length,
        issue_markdown_r2_key: issueMarkdownKey
      });
      if (stepIssues.length > 0) await insertIssues(env, stepIssues);
      allStepRows.push({ ...row, ...score, issueMarkdownKey });
    }

    await finishScenario(env, scenarioId, 'SUCCEEDED');
  }

  await updateRunStatus(env, runId, 'RUNNING', 'REPORTING');
  const failed = allStepRows.filter((s) => s.status === 'FAILED').length;
  const passed = allStepRows.filter((s) => s.status === 'PASSED').length;
  const blocked = allStepRows.filter((s) => s.status === 'BLOCKED_BY_DEPENDENCY').length;

  const scoring = scoreRun({
    totalOperations: allStepRows.length,
    liveTested: passed + failed,
    staticOnly: 0,
    blocked,
    fixtureRequired: 0,
    skipped: 0,
    failed,
    passed,
    avgEndpointScore: allStepRows.reduce((sum, r) => sum + (r.endpointScore ?? 0), 0) / Math.max(allStepRows.length, 1),
    avgCompatibilityScore: allStepRows.reduce((sum, r) => sum + (r.compatibilityScore ?? 0), 0) / Math.max(allStepRows.length, 1)
  });

  const summary = buildRunSummaryMarkdown({
    runId,
    label: null,
    timestamp: new Date().toISOString(),
    status: failed > 0 ? 'FAILED' : 'SUCCEEDED',
    totalOperations: allStepRows.length,
    liveTested: passed + failed,
    staticOnly: 0,
    skipped: 0,
    blocked,
    fixtureRequired: 0,
    failed,
    passed,
    ...scoring
  });
  const summaryKey = await putText(env, runKey(runId, 'summary', 'run-summary.md'), summary);

  await env.DB.prepare(
    `UPDATE runs SET status = ?1, phase = 'COMPLETED', finished_at = ?2,
      total_operations = ?3, completed_operations = ?4, passed_operations = ?5, failed_operations = ?6,
      blocked_operations = ?7, manual_spec_score = ?8, production_openapi3_score = ?9,
      live_verified_coverage_score = ?10, generation_readiness = ?11, summary_report_r2_key = ?12
     WHERE id = ?13`
  )
    .bind(
      failed > 0 ? 'FAILED' : 'SUCCEEDED',
      new Date().toISOString(),
      allStepRows.length,
      passed + failed,
      passed,
      failed,
      blocked,
      scoring.manualSpecScore,
      scoring.productionOpenapi3Score,
      scoring.liveVerifiedCoverageScore,
      scoring.generationReadiness,
      summaryKey,
      runId
    )
    .run();
}
