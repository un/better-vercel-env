# Learnings Log - 26021302 vercel-env-manager-cli-runtime

Use this file as a prepend-only log.

## 2026-02-13 15:45 - Step 36 - personal scope CLI behavior
- Context: Running manual smoke checks against project `wiggy` with a logged-in personal account.
- Learning: Passing `--scope <personal-username>` fails for personal accounts (`You cannot set your Personal Account as the scope.`).
- Impact: Resolve personal scopes to `null` and omit `--scope` for CLI commands in read/write paths.

## 2026-02-13 14:40 - Plan bootstrap - CLI value retrieval validated
- Context: Verifying whether CLI can read plaintext env values for project wiggy.
- Learning: `vercel env pull` returned plaintext values where prior SDK/list paths showed encrypted values.
- Impact: The read path should pivot to CLI pull parsing, with reserved runtime keys filtered.

## 2026-02-13 14:40 - Plan bootstrap - reserved vars in pull output
- Context: Inspecting pulled `.env.local` output from Vercel CLI.
- Learning: Pull output can include runtime-managed keys such as `VERCEL_OIDC_TOKEN`.
- Impact: Add explicit reserved-key filtering policy so these vars do not appear as user-editable rows.

## Operating protocol for sub-agents
- Before starting any step, read this file completely.
- After finishing a step, prepend any new learnings at the top using the template below.
- Only add a learning when it changes how future steps should be executed.
- Keep entries short, concrete, and actionable.

## Entry template
```
## YYYY-MM-DD HH:MM - Step <serial> - <short title>
- Context: <what was being done>
- Learning: <what was discovered>
- Impact: <what future steps should do differently>
```
