# SDK and Token Session Migration Map

## SDK call sites

### Auth bootstrap
- `src/lib/vercel/client.ts`: constructs `new Vercel({ bearerToken })` from app-managed token cookie.

### Read path
- `src/lib/vercel/environments.ts`: `environment.getV9ProjectsIdOrNameCustomEnvironments` for custom env columns.
- `src/lib/vercel/env-records.ts`: `projects.filterProjectEnvs` + fallback `projects.getProjectEnv` for encrypted rows.
- `src/lib/vercel/project-snapshot.ts`: composes env columns and records using SDK-backed helpers.

### Write path
- `src/lib/vercel/apply.ts`: `projects.createProjectEnv`, `projects.editProjectEnv`, `projects.removeProjectEnv`.

### SDK-backed routes
- `src/app/api/vercel/scopes/route.ts`
- `src/app/api/vercel/projects/route.ts`
- `src/app/api/vercel/project-snapshot/route.ts`
- `src/app/api/vercel/env-records/route.ts`
- `src/app/api/vercel/apply/route.ts`

## Token session call sites

### Token ingest and validation
- `src/app/api/session/token/route.ts`: receives pasted token, validates token, writes/deletes auth cookie.
- `src/lib/vercel/validate-token.ts`: validates token by calling SDK `user.getAuthUser()`.

### Cookie/session infrastructure
- `src/lib/session/session-cookie.ts`: cookie encoding, TTL, set/clear helpers.
- `src/lib/session/get-session-token.ts`: server-side read helper for token cookie.

### UI/session gating
- `src/components/onboarding/token-onboarding-form.tsx`: token paste UI and submit flow.
- `src/app/projects/layout.tsx`: redirects to onboarding when token cookie is missing.

## Migration targets

- Replace SDK call sites with CLI adapter functions under `src/lib/vercel-cli/`.
- Replace token session onboarding with CLI auth status checks (`vercel whoami`) and CLI-first guidance (`vercel login`, `vercel switch`).
- Remove token cookie dependencies from routes and layouts.
