import type { ScenarioConfig } from './scenarioTypes';

const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  {
    name: 'product_creation_flow',
    orderIndex: 1,
    steps: [
      {
        stepKey: 'create-category',
        operation: { method: 'POST', path: '/categories' },
        executionMode: 'LIVE_SCHEMA_CHECK',
        responseExtractions: [{ source: 'body.data.id', target: 'category_id' }]
      },
      {
        stepKey: 'create-product',
        operation: { method: 'POST', path: '/products' },
        dependsOn: ['create-category'],
        executionMode: 'LIVE_SCHEMA_CHECK_WITH_DEPENDENCIES',
        requestBindings: [{ target: 'body.category_id', source: 'category_id' }],
        responseExtractions: [{ source: 'body.data.id', target: 'product_id' }]
      }
    ]
  }
];

export function loadScenarios(): ScenarioConfig[] {
  return DEFAULT_SCENARIOS;
}
