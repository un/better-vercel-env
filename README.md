# Vercel Better Env

Local-first environment variable editor for Vercel projects.

## CLI auth setup (required)

This app uses your local Vercel CLI session. Before opening the UI, run:

```bash
vercel login
vercel whoami
```

If you work across teams, select scope with:

```bash
vercel switch
```

## Quickstart

### Run with npx

```bash
npx vercel-better-env
```

The local app starts at `http://127.0.0.1:6969` (or the next available local port if 6969 is occupied).

### Run from source

```bash
npm install
npm run dev
```

### Validate locally

```bash
npm run verify
```

## What it does

- Uses a key-first matrix editor for environment values and targets.
- Plans create/update/delete operations before apply.
- Requires an exact confirmation phrase before apply.
- Re-validates the baseline hash before writes to detect drift.
- Reads and writes env vars through Vercel CLI commands (`env pull`, `env add`, `env rm`).

## Limitations (v1)

- Auth is CLI-managed (`vercel login`), not app-managed cookies/sessions.
- Pulled `.env` snapshots are temporary and removed after parsing.
- System environment variables are read-only.
- Runtime reserved keys (for example `VERCEL_*`) are filtered out from editable rows.
- Git branch-specific environment variables are read-only when CLI capability is unavailable.
- Apply execution currently supports `create_env`, `update_env`, and `delete_env`; other operation kinds are reported as skipped.

## Troubleshooting

- If onboarding shows unauthenticated, run `vercel login` again, then click refresh in the app.
- If projects are missing, verify current scope with `vercel whoami` and change it with `vercel switch`.
- If apply returns conflict, reload the snapshot and re-apply with a fresh baseline hash.
- If CLI commands fail, ensure `vercel` is installed and available on your `PATH`.

## Development notes

- Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Zustand, Zod, Vercel CLI runtime adapter.
- Default host/port: `127.0.0.1:6969`.
