import type { GenerationReadiness, StepIssue } from '../types';

export function scoreStep(issues: StepIssue[]): {
  endpointScore: number;
  compatibilityScore: number;
  generationReadiness: GenerationReadiness;
} {
  let endpointScore = 100;
  let compatibilityScore = 100;
  for (const issue of issues) {
    const penalty = issue.severity === 'CRITICAL' ? 40 : issue.severity === 'HIGH' ? 25 : issue.severity === 'MEDIUM' ? 10 : 5;
    endpointScore -= penalty;
    compatibilityScore -= Math.round(penalty * 0.8);
  }

  endpointScore = Math.max(0, endpointScore);
  compatibilityScore = Math.max(0, compatibilityScore);

  const generationReadiness: GenerationReadiness =
    endpointScore >= 90 && compatibilityScore >= 90
      ? 'READY'
      : endpointScore >= 65 && compatibilityScore >= 60
      ? 'READY_WITH_FIXES'
      : 'NOT_READY';

  return { endpointScore, compatibilityScore, generationReadiness };
}
