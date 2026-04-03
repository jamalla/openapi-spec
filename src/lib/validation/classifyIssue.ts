import type { LikelySource, StepIssue } from '../types';

export function classifyIssue(code: string, message: string, scenarioStepId: string): StepIssue {
  const likelySource: LikelySource =
    code.includes('undocumented') || code.includes('mismatch')
      ? 'likely_spec_issue'
      : code.includes('timeout') || code.includes('network')
      ? 'insufficient_evidence'
      : 'likely_production_issue';

  const severity: StepIssue['severity'] =
    code.includes('auth') || code.includes('invalid_json') || code.includes('schema') ? 'HIGH' : 'MEDIUM';

  return {
    id: crypto.randomUUID(),
    scenarioStepId,
    code,
    severity,
    title: code,
    message,
    likelySource,
    blockingForGeneration: severity === 'HIGH' || severity === 'CRITICAL'
  };
}
