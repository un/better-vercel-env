import type { EnvMatrixDraft } from "../../lib/env-model";

export interface UndoRowResult {
  draft: EnvMatrixDraft;
  changed: boolean;
}

function rowFingerprint(row: EnvMatrixDraft["rows"][number]): string {
  return JSON.stringify({
    key: row.key,
    values: row.values,
    assignments: row.assignments,
    isNew: row.isNew,
  });
}

export function undoRowDraftChange(baseline: EnvMatrixDraft, draft: EnvMatrixDraft, rowId: string): UndoRowResult {
  const baselineRow = baseline.rows.find((row) => row.rowId === rowId);
  const draftRow = draft.rows.find((row) => row.rowId === rowId);

  if (!draftRow) {
    return {
      draft,
      changed: false,
    };
  }

  if (!baselineRow) {
    return {
      draft: {
        ...draft,
        rows: draft.rows.filter((row) => row.rowId !== rowId),
      },
      changed: true,
    };
  }

  const changed = rowFingerprint(draftRow) !== rowFingerprint(baselineRow);
  if (!changed) {
    return {
      draft,
      changed: false,
    };
  }

  return {
    draft: {
      ...draft,
      rows: draft.rows.map((row) => (row.rowId === rowId ? structuredClone(baselineRow) : row)),
    },
    changed: true,
  };
}
