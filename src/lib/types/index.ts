export type RunStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
export type RunPhase =
  | 'INITIALIZING'
  | 'FETCHING_SPEC'
  | 'STATIC_VALIDATION'
  | 'ORCHESTRATING'
  | 'LIVE_VALIDATION'
  | 'REPORTING'
  | 'COMPLETED'
  | 'FAILED';

export type ExecutionMode =
  | 'STATIC_ONLY'
  | 'LIVE_SCHEMA_CHECK'
  | 'LIVE_SCHEMA_CHECK_WITH_DEPENDENCIES'
  | 'LIVE_SCHEMA_CHECK_WITH_FIXTURE'
  | 'SKIPPED_UNSAFE'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'FIXTURE_REQUIRED';

export type StepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'SKIPPED_UNSAFE'
  | 'BLOCKED_BY_DEPENDENCY'
  | 'FIXTURE_REQUIRED';

export type GenerationReadiness = 'READY' | 'READY_WITH_FIXES' | 'NOT_READY';
export type LikelySource =
  | 'likely_spec_issue'
  | 'likely_production_issue'
  | 'ambiguous'
  | 'insufficient_evidence';

export interface StepIssue {
  id: string;
  scenarioStepId: string;
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  message: string;
  likelySource: LikelySource;
  blockingForGeneration: boolean;
}

export interface ScenarioStepDefinition {
  stepKey: string;
  operationId?: string;
  method?: string;
  path?: string;
  dependsOn?: string[];
  executionMode: ExecutionMode;
  allowMutating?: boolean;
  fixtureRequired?: string[];
  requestBindings?: Array<{
    target: string;
    source: string;
  }>;
  responseExtractions?: Array<{
    source: string;
    target: string;
  }>;
}

export interface ScenarioDefinition {
  name: string;
  orderIndex: number;
  steps: ScenarioStepDefinition[];
}

export interface RunCreateInput {
  label?: string;
  notes?: string;
  allowMutating: boolean;
  includeOperations?: string[];
  excludeOperations?: string[];
  dryRun?: boolean;
}

export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  ASSETS: Fetcher;
  VALIDATION_WORKFLOW?: {
    create: (options: { id: string; params: unknown }) => Promise<unknown>;
  };
  SPEC_POST_URL: string;
  SPEC_API_KEY: string;
  SPEC_API_KEY_HEADER?: string;
  SPEC_AUTH_HEADER?: string;
  SPEC_POST_BODY?: string;
  SPEC_POST_HEADERS?: string;
  SPEC_RESPONSE_PATH?: string;
  TARGET_API_BASE_URL: string;
}
