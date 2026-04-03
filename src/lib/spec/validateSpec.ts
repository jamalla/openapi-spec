import type { StepIssue } from '../types';

export function validateSpec(spec: any): StepIssue[] {
  const issues: StepIssue[] = [];
  if (!spec?.openapi?.startsWith?.('3.')) {
    issues.push(issue('invalid_openapi_version', 'CRITICAL', 'OpenAPI version missing or not 3.x'));
  }
  if (!spec?.paths || typeof spec.paths !== 'object') {
    issues.push(issue('missing_paths', 'CRITICAL', 'OpenAPI paths object missing'));
    return issues;
  }

  const operationIds = new Set<string>();
  for (const [path, methods] of Object.entries<any>(spec.paths)) {
    for (const [method, op] of Object.entries<any>(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) continue;
      if (!op.responses || Object.keys(op.responses).length === 0) {
        issues.push(issue('missing_response_definitions', 'HIGH', `Missing responses for ${method.toUpperCase()} ${path}`));
      }
      if (op.operationId) {
        if (operationIds.has(op.operationId)) {
          issues.push(issue('duplicate_operation_id', 'HIGH', `Duplicate operationId ${op.operationId}`));
        }
        operationIds.add(op.operationId);
      }
      for (const parameter of op.parameters ?? []) {
        if (parameter.required && !parameter.schema) {
          issues.push(issue('missing_required_parameter_schema', 'MEDIUM', `Required parameter missing schema on ${method.toUpperCase()} ${path}`));
        }
      }
    }
  }
  return issues;
}

const issue = (code: string, severity: StepIssue['severity'], message: string): StepIssue => ({
  id: `static-${code}-${crypto.randomUUID()}`,
  scenarioStepId: 'static',
  code,
  severity,
  title: code,
  message,
  likelySource: 'likely_spec_issue',
  blockingForGeneration: severity === 'CRITICAL' || severity === 'HIGH'
});
