import { classifyIssue } from './classifyIssue';

export function compareResponse(args: {
  expectedStatusCodes: number[];
  expectedContentTypes: string[];
  actualStatus: number;
  actualContentType: string;
  body: unknown;
  scenarioStepId: string;
}) {
  const issues = [];
  if (!args.expectedStatusCodes.includes(args.actualStatus)) {
    issues.push(classifyIssue('undocumented_status_code', `Received ${args.actualStatus}`, args.scenarioStepId));
  }
  if (args.expectedContentTypes.length > 0 && !args.expectedContentTypes.some((ct) => args.actualContentType.includes(ct))) {
    issues.push(classifyIssue('content_type_mismatch', `Received ${args.actualContentType}`, args.scenarioStepId));
  }
  if (typeof args.body === 'string') {
    try {
      JSON.parse(args.body);
    } catch {
      issues.push(classifyIssue('invalid_json', 'Body is not valid JSON.', args.scenarioStepId));
    }
  }
  return issues;
}
