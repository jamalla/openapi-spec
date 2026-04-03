import type { StepIssue } from '../types';

export function buildIssueMarkdown(input: {
  scenario: string;
  stepKey: string;
  method: string;
  path: string;
  operationId?: string;
  executionMode: string;
  status: string;
  endpointScore: number;
  compatibilityScore: number;
  issues: StepIssue[];
  expected: Record<string, unknown>;
  actual: Record<string, unknown>;
  dependencyContext: Record<string, unknown>;
  recommendation: string;
}) {
  const topSeverity = input.issues[0]?.severity ?? 'INFO';
  return `# Issue Report: ${input.method} ${input.path}

## Endpoint / Step
- Scenario: ${input.scenario}
- Step Key: ${input.stepKey}
- Method: ${input.method}
- Path: ${input.path}
- OperationId: ${input.operationId ?? 'N/A'}
- Execution Mode: ${input.executionMode}

## Summary
${input.issues.map((i) => i.message).join(' ')}

## Validation Result
- Endpoint Score: ${input.endpointScore}/100
- Severity: ${topSeverity}
- Status: ${input.status}

## Detected Issues
${input.issues.map((i) => `- ${i.code}: ${i.message}`).join('\n')}

## Expected According to Manual OpenAPI
- ${JSON.stringify(input.expected)}

## Actual Production Behavior
- ${JSON.stringify(input.actual)}

## Dependency Context
- ${JSON.stringify(input.dependencyContext)}

## OpenAPI 3 Compatibility Assessment
- Compatibility Score: ${input.compatibilityScore}

## Recommended Fix
${input.recommendation}

## Classification
- Categories: ${input.issues.map((i) => i.code).join(', ')}
- Likely Source: ${input.issues.map((i) => i.likelySource).join(', ')}
- Blocking for generation: ${input.issues.some((i) => i.blockingForGeneration) ? 'yes' : 'no'}
`;
}
