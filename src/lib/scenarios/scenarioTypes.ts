export type BindingTarget = `body.${string}` | `path.${string}` | `query.${string}` | `header.${string}`;

export interface ResponseExtraction {
  source: string;
  target: string;
}

export interface ScenarioConfigStep {
  stepKey: string;
  operation: { method: string; path: string; operationId?: string };
  dependsOn?: string[];
  executionMode:
    | 'STATIC_ONLY'
    | 'LIVE_SCHEMA_CHECK'
    | 'LIVE_SCHEMA_CHECK_WITH_DEPENDENCIES'
    | 'LIVE_SCHEMA_CHECK_WITH_FIXTURE';
  requestBindings?: Array<{ target: BindingTarget; source: string }>;
  responseExtractions?: ResponseExtraction[];
  fixtureRequirements?: string[];
}

export interface ScenarioConfig {
  name: string;
  orderIndex: number;
  steps: ScenarioConfigStep[];
}
