# Reserved Runtime Key Policy

The matrix editor excludes runtime-managed variables from editable rows.

Current policy:

- Filter out exact keys: `NX_DAEMON`, `TURBO_CACHE`, `TURBO_DOWNLOAD_LOCAL_ENABLED`, `TURBO_REMOTE_ONLY`, `TURBO_RUN_SUMMARY`, `VERCEL`.
- Filter out keys with prefix `VERCEL_`.
- Keep filtered keys out of draft rows and planned operations.
- Treat the filter as backend-enforced policy, not just a UI hint.

Rationale:

- `vercel env pull` can include runtime-injected values that are not user-managed.
- Showing them as editable would create false expectations and unsafe writes.
