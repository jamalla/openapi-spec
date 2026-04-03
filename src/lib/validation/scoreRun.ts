import type { GenerationReadiness, StepStatus } from '../types';

interface ScoreRunInput {
  totalOperations: number;
  liveTested: number;
  staticOnly: number;
  blocked: number;
  fixtureRequired: number;
  skipped: number;
  failed: number;
  passed: number;
  avgEndpointScore: number;
  avgCompatibilityScore: number;
}

export function scoreRun(input: ScoreRunInput) {
  const manualSpecScore = Math.round(Math.max(0, input.avgEndpointScore - input.failed * 2));
  const productionOpenapi3Score = Math.round(Math.max(0, input.avgCompatibilityScore - input.failed * 3));

  const baseCoverage = input.totalOperations === 0 ? 0 : (input.liveTested / input.totalOperations) * 100;
  const penalty = input.blocked * 4 + input.fixtureRequired * 3 + input.skipped * 2;
  const liveVerifiedCoverageScore = Math.max(0, Math.round(baseCoverage - penalty / Math.max(1, input.totalOperations)));

  const generationReadiness: GenerationReadiness =
    manualSpecScore >= 85 && productionOpenapi3Score >= 85 && liveVerifiedCoverageScore >= 75
      ? 'READY'
      : manualSpecScore >= 60 && productionOpenapi3Score >= 60
      ? 'READY_WITH_FIXES'
      : 'NOT_READY';

  return { manualSpecScore, productionOpenapi3Score, liveVerifiedCoverageScore, generationReadiness };
}

export const stepStatusToCountKey = (status: StepStatus) => {
  const map: Record<StepStatus, string> = {
    PENDING: 'completed_operations',
    RUNNING: 'completed_operations',
    PASSED: 'passed_operations',
    FAILED: 'failed_operations',
    SKIPPED_UNSAFE: 'skipped_operations',
    BLOCKED_BY_DEPENDENCY: 'blocked_operations',
    FIXTURE_REQUIRED: 'fixture_required_operations'
  };
  return map[status];
};
