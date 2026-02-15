import type { EnvMatrixDraft, EnvMatrixRowDraft, ValuePoolEntry } from "@/lib/env-model";

export interface RemoveValueResult {
  draft: EnvMatrixDraft;
  removed: boolean;
  reason: "assigned" | "not_found" | null;
}

function nextValueId(row: EnvMatrixRowDraft): string {
  const highest = row.values.reduce((max, value) => {
    const match = /^value-(\d+)$/.exec(value.id);
    if (!match) {
      return max;
    }

    const serial = Number.parseInt(match[1], 10);
    return Number.isNaN(serial) ? max : Math.max(max, serial);
  }, 0);

  return `value-${highest + 1}`;
}

function createValueEntry(row: EnvMatrixRowDraft): ValuePoolEntry {
  return {
    id: nextValueId(row),
    content: "",
    type: "plain",
    comment: null,
    gitBranch: null,
    readOnlyReason: null,
    sourceRows: [],
  };
}

export function addValueToDraft(draft: EnvMatrixDraft, rowId: string): { draft: EnvMatrixDraft; addedValueId: string | null } {
  let addedValueId: string | null = null;

  const rows = draft.rows.map((row) => {
    if (row.rowId !== rowId) {
      return row;
    }

    const entry = createValueEntry(row);
    addedValueId = entry.id;

    return {
      ...row,
      values: [...row.values, entry],
    };
  });

  return {
    draft: {
      ...draft,
      rows,
    },
    addedValueId,
  };
}

export function editValueInDraft(
  draft: EnvMatrixDraft,
  rowId: string,
  valueId: string,
  content: string,
): { draft: EnvMatrixDraft; updated: boolean } {
  let updated = false;

  const rows = draft.rows.map((row) => {
    if (row.rowId !== rowId) {
      return row;
    }

    const values = row.values.map((value) => {
      if (value.id !== valueId) {
        return value;
      }

      updated = true;
      return {
        ...value,
        content,
      };
    });

    return {
      ...row,
      values,
    };
  });

  return {
    draft: {
      ...draft,
      rows,
    },
    updated,
  };
}

export function removeValueFromDraft(draft: EnvMatrixDraft, rowId: string, valueId: string): RemoveValueResult {
  let removed = false;
  let reason: RemoveValueResult["reason"] = "not_found";

  const rows = draft.rows.map((row) => {
    if (row.rowId !== rowId) {
      return row;
    }

    const value = row.values.find((item) => item.id === valueId);
    if (!value) {
      return row;
    }

    const assigned = Object.values(row.assignments).includes(valueId);
    if (assigned) {
      reason = "assigned";
      return row;
    }

    removed = true;
    reason = null;

    return {
      ...row,
      values: row.values.filter((item) => item.id !== valueId),
    };
  });

  return {
    draft: {
      ...draft,
      rows,
    },
    removed,
    reason,
  };
}
