# OpenTUI Binding Strategy

## Decision
Use OpenTUI **core constructs** (`@opentui/core`) as the primary UI layer.

## Why core constructs
- Deterministic control over focus, key handling, and render lifecycle.
- Fewer runtime layers while migrating from a non-React terminal app target.
- Easier in-process composition with existing domain modules without HTTP boundaries.
- Avoids bringing React reconciliation semantics into terminal flow until needed.

## Non-selected option
- `@opentui/react` is deferred for now.
- It can be re-evaluated after parity is reached if component ergonomics becomes a bottleneck.

## Spike verification
- Minimal construct-based file: `opentui-core-spike.ts`.
- Compile check command: `bun build opentui-core-spike.ts --outfile /tmp/opentui-core-spike.js`.
