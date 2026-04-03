import { describe, expect, it } from 'vitest';
import { compareResponse } from '../src/lib/validation/compareResponse';
import { classifyIssue } from '../src/lib/validation/classifyIssue';
import { scoreStep } from '../src/lib/validation/scoreStep';
import { scoreRun } from '../src/lib/validation/scoreRun';
import { buildIssueMarkdown } from '../src/lib/reporting/buildIssueMarkdown';
import { buildCsvExport } from '../src/lib/reporting/buildCsvExport';
import { runKey } from '../src/lib/storage/r2';

describe('validation and reporting', () => {
  it('compares response', () => {
    const issues = compareResponse({
      expectedStatusCodes: [200],
      expectedContentTypes: ['application/json'],
      actualStatus: 500,
      actualContentType: 'text/html',
      body: '<html></html>',
      scenarioStepId: 's1'
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it('scores step and run', () => {
    const issue = classifyIssue('response_schema_mismatch', 'mismatch', 's1');
    const step = scoreStep([issue]);
    expect(step.endpointScore).toBeLessThan(100);

    const run = scoreRun({
      totalOperations: 10,
      liveTested: 7,
      staticOnly: 1,
      blocked: 1,
      fixtureRequired: 1,
      skipped: 0,
      failed: 2,
      passed: 5,
      avgEndpointScore: 80,
      avgCompatibilityScore: 78
    });
    expect(run.generationReadiness).toBe('READY_WITH_FIXES');
  });

  it('builds markdown and csv', () => {
    const issue = classifyIssue('undocumented_status_code', 'status mismatch', 'x');
    const md = buildIssueMarkdown({
      scenario: 's',
      stepKey: 'k',
      method: 'GET',
      path: '/x',
      executionMode: 'LIVE_SCHEMA_CHECK',
      status: 'FAILED',
      endpointScore: 75,
      compatibilityScore: 70,
      issues: [issue],
      expected: {},
      actual: {},
      dependencyContext: {},
      recommendation: 'fix'
    });
    expect(md).toContain('# Issue Report');

    const csv = buildCsvExport([{ run_id: 'r', scenario: 's', step_key: 'k' }]);
    expect(csv.split('\n')[0]).toContain('run_id');
  });

  it('sanitizes r2 key', () => {
    expect(runKey('RUN 1', 'issues', 'POST /products.md')).toBe('runs/run_1/issues/post__products_md');
  });
});
