# Vercel Better Env

Local-first environment variable editor for Vercel projects.

## Token setup (required)

Create a Vercel token first:

- https://vercel.com/account/settings/tokens

Then launch the app and paste your token into onboarding.

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
- Stores auth token in server memory only for the active local session.

## Limitations (v1)

- Session-only auth: token is kept in memory and tied to an HTTP-only session cookie.
- No persistence: token is not written to `.env` files, disk, or long-lived local storage.
- System environment variables are read-only.
- Git branch-specific environment variables are read-only.
- Apply execution currently supports `create_env`, `update_env`, and `delete_env`; other operation kinds are reported as skipped.

## Development notes

- Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Zustand, Zod, `@vercel/sdk`.
- Default host/port: `127.0.0.1:6969`.
