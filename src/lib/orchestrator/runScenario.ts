import type { ScenarioConfig } from '../scenarios/scenarioTypes';
import { bindContext } from './bindContext';
import { extractOutputs } from './extractOutputs';

interface ExecutionResult {
  status: 'PASSED' | 'FAILED';
  issues: Array<{ code: string; severity: string; message: string }>;
  response?: { status: number; headers: Record<string, string>; body: unknown };
}

type Executor = (step: ScenarioConfig['steps'][number], request: Record<string, unknown>) => Promise<ExecutionResult>;

export async function runScenario(scenario: ScenarioConfig, executor: Executor, context: Record<string, unknown>) {
  const stepResults: Array<Record<string, unknown>> = [];

  for (const step of scenario.steps) {
    const blockingDependency = step.dependsOn?.find((dep) => {
      const dependencyResult = stepResults.find((s) => s.stepKey === dep);
      return dependencyResult && dependencyResult.status !== 'PASSED';
    });

    if (blockingDependency) {
      stepResults.push({ stepKey: step.stepKey, status: 'BLOCKED_BY_DEPENDENCY', dependency: blockingDependency, issues: [] });
      continue;
    }

    const request = bindContext({ body: {}, path: {}, query: {}, header: {} }, step.requestBindings, context);
    const result = await executor(step, request);
    if (result.response) Object.assign(context, extractOutputs(result.response, step.responseExtractions));

    stepResults.push({
      stepKey: step.stepKey,
      method: step.operation.method,
      path: step.operation.path,
      status: result.status,
      issues: result.issues,
      request,
      response: result.response
    });
  }

  return { context, stepResults };
}
