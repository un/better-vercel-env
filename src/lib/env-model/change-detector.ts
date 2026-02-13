import type { EnvMatrixChange, EnvMatrixDraft, EnvMatrixRowDraft } from "./types";

function rowValuesFingerprint(row: EnvMatrixRowDraft): string {
  return JSON.stringify(
    row.values.map((value) => ({
      content: value.content,
      type: value.type,
      comment: value.comment,
      gitBranch: value.gitBranch,
      readOnlyReason: value.readOnlyReason,
    })),
  );
}

function rowAssignmentsFingerprint(row: EnvMatrixRowDraft): string {
  return JSON.stringify(row.assignments);
}

export function detectDraftChanges(baseline: EnvMatrixDraft, draft: EnvMatrixDraft): EnvMatrixChange[] {
  const baselineRows = new Map(baseline.rows.map((row) => [row.rowId, row]));
  const draftRows = new Map(draft.rows.map((row) => [row.rowId, row]));

  const changes: EnvMatrixChange[] = [];

  draft.rows.forEach((row) => {
    if (!baselineRows.has(row.rowId)) {
      changes.push({
        changeId: `create:${row.rowId}`,
        kind: "create",
        rowId: row.rowId,
        summary: `Create key ${row.key}`,
      });
    }
  });

  baseline.rows.forEach((row) => {
    if (!draftRows.has(row.rowId)) {
      changes.push({
        changeId: `delete:${row.rowId}`,
        kind: "delete",
        rowId: row.rowId,
        summary: `Delete key ${row.key}`,
      });
    }
  });

  draft.rows.forEach((row) => {
    const baselineRow = baselineRows.get(row.rowId);
    if (!baselineRow) {
      return;
    }

    if (baselineRow.key !== row.key) {
      changes.push({
        changeId: `rename:${row.rowId}`,
        kind: "rename",
        rowId: row.rowId,
        summary: `Rename key ${baselineRow.key} -> ${row.key}`,
      });
    }

    const valuesChanged = rowValuesFingerprint(baselineRow) !== rowValuesFingerprint(row);
    const assignmentsChanged =
      rowAssignmentsFingerprint(baselineRow) !== rowAssignmentsFingerprint(row);

    if (valuesChanged) {
      changes.push({
        changeId: `update:${row.rowId}`,
        kind: "update",
        rowId: row.rowId,
        summary: `Update value pool for ${row.key}`,
      });
    }

    if (assignmentsChanged) {
      changes.push({
        changeId: `retarget:${row.rowId}`,
        kind: "retarget",
        rowId: row.rowId,
        summary: `Update environment assignments for ${row.key}`,
      });
    }
  });

  return changes;
}
