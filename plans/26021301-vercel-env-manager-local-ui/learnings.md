# Learnings Log - 26021301 vercel-env-manager-local-ui

Use this file as a prepend-only log.

## 2026-02-13 12:22 - Step 18 - orphan dev process risk
- Context: Verifying startup URL output while repeatedly launching the CLI.
- Learning: If the parent CLI exits without forwarding shutdown signals, Next dev can stay running and cause `EADDRINUSE` or `.next/dev/lock` errors on the next launch.
- Impact: Ensure explicit signal forwarding and child cleanup in the CLI before relying on repeated local starts.

## 2026-02-13 12:14 - Step 12 - duplicate base applies
- Context: Refining generated shadcn globals while finalizing Geist typography setup.
- Learning: The generated `@layer base` block contained duplicate `@apply` lines, which is harmless but noisy.
- Impact: Clean duplicate utility applies when editing globals to keep diffs readable and avoid confusion.

## 2026-02-13 12:12 - Step 10 - shadcn init side effects
- Context: Initializing shadcn/ui foundation on top of Tailwind v4 setup.
- Learning: `shadcn init` updates `src/app/globals.css` and installs extra utility dependencies automatically.
- Impact: Future style/token edits should start from the generated shadcn variables instead of pre-init assumptions.

## 2026-02-13 12:09 - Step 5 - vitest alias mismatch
- Context: Adding initial Vitest setup and first sample unit test.
- Learning: Vitest does not automatically honor Next.js `@/*` path alias with the current minimal config.
- Impact: Use relative imports in tests or add explicit alias mapping in `vitest.config.ts` before relying on `@/` imports.

## 2026-02-13 12:06 - Step 1 - scaffold in non-empty repo
- Context: Bootstrapping Next.js in a repository that already contained planning files.
- Learning: `create-next-app` refuses to initialize directly in non-empty directories, so scaffold in a temporary folder and copy project files into root.
- Impact: If regeneration is needed later, avoid running scaffold commands directly in root unless it is empty.

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

## Current learnings
- None yet.
