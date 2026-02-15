# Vercel Better Env (OpenTUI)

Terminal-first environment variable manager for Vercel projects.

## Requirements

- `vercel` CLI installed and authenticated.
- Bun installed (runtime for OpenTUI launch path).

## Auth Setup

```bash
vercel login
vercel whoami
```

If you work across teams:

```bash
vercel switch
```

## Quickstart

### Run with npx

```bash
npx vercel-better-env
```

### Run from source

```bash
npm install
npm run tui
```

### Validate locally

```bash
npm run verify
```

## Core Flow

1. Auth status screen (`vercel whoami` backed).
2. Scope and project picker.
3. Matrix editor for keys, value pool, and assignments.
4. Live change log + per-row undo.
5. Confirm phrase gate before apply.
6. Apply report with done/failed/skipped grouping.

## Keyboard Controls

- Global: `q` quit, `r` refresh auth, `?` help.
- Picker: `tab` scope, `j/k` project, `enter` open editor.
- Editor:
  - Navigation: `j/k` row, `h/l` value, `[` / `]` environment.
  - Edits: `e` key, `a` add value, `v` edit value, `x` delete value.
  - Assignment: `s` set, `u` unset.
  - Other: `z` undo row, `p` apply.
- Confirm: type exact phrase, `enter` apply, `esc` cancel.
- Report: `enter` back to editor.

## Safety Behavior

- Uses Vercel CLI reads/writes (`env pull`, `env add`, `env rm`).
- Baseline hash is revalidated before writes.
- In-flight apply lock prevents concurrent applies per project+scope.
- Reserved runtime keys are hidden and ignored (`VERCEL_*`, `VERCEL`, `NX_DAEMON`, turbo keys).
- Apply gate requires exact confirm phrase via shared validator.

## Current Limitations

- Custom environment writes are skipped in CLI apply path.
- Branch-specific writes are capability-gated and may be read-only.
- Retarget/rename planner kinds outside supported CLI actions are reported as skipped.

## Troubleshooting

- Unauthenticated screen: rerun `vercel login`, then press `r` in app.
- Missing projects: verify scope with `vercel whoami` / `vercel switch`.
- Apply conflict: reload snapshot by re-entering project, then apply again.
- Runtime launch failure: confirm Bun is installed and available on `PATH`.
