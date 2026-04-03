export function buildRunSummaryMarkdown(data: Record<string, unknown>) {
  return `# OpenAPI Contract Certification Report

## Overall Result
- Run ID: ${data.runId}
- Label: ${data.label ?? 'N/A'}
- Timestamp: ${data.timestamp}
- Status: ${data.status}
- Total Operations: ${data.totalOperations}
- Live Tested: ${data.liveTested}
- Static Only: ${data.staticOnly}
- Skipped: ${data.skipped}
- Blocked: ${data.blocked}
- Fixture Required: ${data.fixtureRequired}
- Failed: ${data.failed}
- Passed: ${data.passed}

## Manual Spec Trustworthiness
- Score: ${data.manualSpecScore}

## Production OpenAPI 3 Compatibility
- Score: ${data.productionOpenapi3Score}

## Live Verified Coverage
- Score: ${data.liveVerifiedCoverageScore}

## Generation Readiness
- Decision: ${data.generationReadiness}

## Recommendations
- Focus on high severity step issues first.
`;
}
