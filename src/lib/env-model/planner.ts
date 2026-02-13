import { detectDraftChanges } from "./change-detector";
import type { EnvMatrixDraft } from "./types";
import type { EnvOperation, OperationKind, PlannedOperations } from "./operations";

function toSnapshot(row: EnvMatrixDraft["rows"][number]) {
  return {
    rowId: row.rowId,
    key: row.key,
    value: row.values[0]?.content,
    target: row.sourceRows[0]?.target,
    customEnvironmentIds: row.sourceRows[0]?.customEnvironmentIds,
  };
}

function mapChangeKind(kind: "create" | "update" | "delete" | "rename" | "retarget"): OperationKind {
  if (kind === "create") {
    return "create_env";
  }

  if (kind === "update") {
    return "update_env";
  }

  if (kind === "delete") {
    return "delete_env";
  }

  if (kind === "rename") {
    return "rename_key";
  }

  return "retarget";
}

export function planOperations(baseline: EnvMatrixDraft, draft: EnvMatrixDraft): PlannedOperations {
  const changes = detectDraftChanges(baseline, draft);
  const baselineRows = new Map(baseline.rows.map((row) => [row.rowId, row]));
  const draftRows = new Map(draft.rows.map((row) => [row.rowId, row]));

  const operations: EnvOperation[] = changes.map((change) => {
    const beforeRow = baselineRows.get(change.rowId);
    const afterRow = draftRows.get(change.rowId);

    return {
      id: change.changeId,
      kind: mapChangeKind(change.kind),
      summary: change.summary,
      rowId: change.rowId,
      before: beforeRow ? toSnapshot(beforeRow) : null,
      after: afterRow ? toSnapshot(afterRow) : null,
      undoToken: `undo:${change.changeId}`,
    };
  });

  return { operations };
}
