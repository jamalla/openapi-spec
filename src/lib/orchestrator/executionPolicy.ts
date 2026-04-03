import type { ScenarioConfigStep } from '../scenarios/scenarioTypes';
import type { StepStatus } from '../types';

export function evaluateExecutionPolicy(step: ScenarioConfigStep, allowMutating: boolean, hasFixtureData: boolean): StepStatus {
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(step.operation.method.toUpperCase());
  if (isMutating && !allowMutating) return 'SKIPPED_UNSAFE';
  if (step.executionMode === 'LIVE_SCHEMA_CHECK_WITH_FIXTURE' && !hasFixtureData) return 'FIXTURE_REQUIRED';
  return 'PENDING';
}
