# OpenAPI Contract Certification App (Cloudflare-native)

This app validates a manually maintained OpenAPI 3 spec against production APIs using Cloudflare Workers + Workflows + D1 + R2.

## What it does
- Fetches remote manual OpenAPI via POST using API-key secret.
- Runs static OpenAPI quality checks.
- Executes scenario-based endpoint workflows with dependency context.
- Compares live production behavior against documented contract.
- Classifies issues and stores markdown reports in R2.
- Persists every run and step in D1.
- Exposes dashboard + CSV export.

## Architecture
- **Worker (Hono)**: API + asset serving (`src/worker`).
- **Workflow executor module**: run lifecycle (`src/lib/workflow/validationWorkflow.ts`).
- **D1**: runs, scenarios, steps, issues, events.
- **R2**: summary + per-step issue markdown + artifacts.
- **UI**: lightweight polling dashboard (`src/ui`).

## Required bindings/secrets
- D1 binding: `DB`
- R2 binding: `ARTIFACTS`
- Assets binding: `ASSETS`
- Optional workflow binding: `VALIDATION_WORKFLOW`
- Secrets/vars:
  - `SPEC_POST_URL`
  - `SPEC_API_KEY` (secret)
  - `SPEC_API_KEY_HEADER` (optional, default `x-api-key`)
  - `SPEC_AUTH_HEADER` (optional)
  - `SPEC_POST_HEADERS` (optional JSON)
  - `SPEC_POST_BODY` (optional JSON string)
  - `SPEC_RESPONSE_PATH` (optional dot-path)
  - `TARGET_API_BASE_URL`

## Scenario/dependency model
Define explicit scenarios in `src/lib/scenarios/loadScenarios.ts`. Steps support:
- `dependsOn`
- `requestBindings` from context into body/path/query/header
- `responseExtractions` from body/headers into context
- execution modes including dependency + fixture classes

## Run lifecycle
1. POST `/api/runs` creates run in D1.
2. Worker launches async validation execution.
3. Fetch + parse + validate spec.
4. Run scenarios in dependency order, extracting/binding context.
5. Persist step issues + scores.
6. Write issue markdown and summary markdown to R2.
7. Dashboard polls `/api/runs/:id/progress`.

## API map
- `POST /api/runs`
- `GET /api/runs`
- `GET /api/runs/:id`
- `GET /api/runs/:id/progress`
- `GET /api/runs/:id/results`
- `GET /api/runs/:id/report`
- `GET /api/runs/:id/issues/:issueKey`
- `GET /api/runs/:id/export.csv`

## Scoring
- Manual Spec Trustworthiness (static + live penalties)
- Production OpenAPI 3 Compatibility (contract fitness)
- Live Verified Coverage (live-tested ratio penalized by blocked/fixture/skipped)
- Generation readiness (`READY`, `READY_WITH_FIXES`, `NOT_READY`)

## Deploy
1. Install deps: `npm install`
2. Apply migration: `wrangler d1 execute openapi_contract_runs --file migrations/0001_init.sql`
3. Set secrets/vars in Wrangler config/dashboard.
4. Run: `npm run dev`
5. Deploy: `wrangler deploy`

## Limitations (V1)
- Scenario definitions are explicit and code-configured.
- Live validation currently checks status/content-type/JSON parse and can be extended for deep schema validation.
- UI is intentionally minimal and polling-based.


## CI deployment (GitHub Actions)
A GitHub Actions workflow is included at `.github/workflows/deploy.yml`.

### Trigger
- Automatic on push to `main`
- Manual via `workflow_dispatch`

### Required GitHub Secrets
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SPEC_POST_URL`
- `SPEC_API_KEY`
- `SPEC_AUTH_HEADER` (optional if you use auth header mode)

### Required GitHub Variables
- `TARGET_API_BASE_URL`
- `SPEC_API_KEY_HEADER` (optional)
- `SPEC_POST_HEADERS` (optional JSON)
- `SPEC_POST_BODY` (optional JSON string)
- `SPEC_RESPONSE_PATH` (optional dot path)

The workflow runs `npm ci`, `npm test`, and `npx wrangler deploy`, so deployment does not depend on local machine tooling.
