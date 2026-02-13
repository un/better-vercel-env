import { detectDraftChanges } from "./change-detector";
import type { EnvMatrixDraft } from "./types";
import type { EnvOperation, OperationKind, PlannedOperations } from "./operations";

interface DesiredCombo {
  valueId: string;
  value: string;
  target: Array<"production" | "preview" | "development">;
  customEnvironmentIds: string[];
}

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

function toComboSignature(combo: DesiredCombo): string {
  return JSON.stringify({
    value: combo.value,
    target: [...combo.target].sort(),
    customEnvironmentIds: [...combo.customEnvironmentIds].sort(),
  });
}

function getDesiredCombos(row: EnvMatrixDraft["rows"][number]): DesiredCombo[] {
  const combosByValue = new Map<string, DesiredCombo>();

  Object.entries(row.assignments).forEach(([environmentId, valueId]) => {
    if (!valueId) {
      return;
    }

    const value = row.values.find((item) => item.id === valueId)?.content ?? "";
    const combo = combosByValue.get(valueId) ?? {
      valueId,
      value,
      target: [],
      customEnvironmentIds: [],
    };

    if (
      environmentId === "production" ||
      environmentId === "preview" ||
      environmentId === "development"
    ) {
      combo.target.push(environmentId);
    }

    if (environmentId.startsWith("custom:")) {
      combo.customEnvironmentIds.push(environmentId.replace("custom:", ""));
    }

    combosByValue.set(valueId, combo);
  });

  return Array.from(combosByValue.values());
}

function getExistingComboSignatures(row: EnvMatrixDraft["rows"][number]): Set<string> {
  const signatures = new Set<string>();

  row.sourceRows.forEach((sourceRow) => {
    signatures.add(
      toComboSignature({
        valueId: sourceRow.id,
        value: sourceRow.value,
        target: sourceRow.target,
        customEnvironmentIds: sourceRow.customEnvironmentIds,
      }),
    );
  });

  return signatures;
}

function planCreateOperations(
  baselineRows: Map<string, EnvMatrixDraft["rows"][number]>,
  draftRows: Map<string, EnvMatrixDraft["rows"][number]>,
): EnvOperation[] {
  const operations: EnvOperation[] = [];

  draftRows.forEach((draftRow, rowId) => {
    const baselineRow = baselineRows.get(rowId);
    const existingSignatures = baselineRow ? getExistingComboSignatures(baselineRow) : new Set<string>();
    const desiredCombos = getDesiredCombos(draftRow);

    desiredCombos.forEach((combo) => {
      const signature = toComboSignature(combo);
      if (existingSignatures.has(signature)) {
        return;
      }

      operations.push({
        id: `create-combo:${rowId}:${combo.valueId}`,
        kind: "create_env",
        summary: `Create value-target combination for ${draftRow.key}`,
        rowId,
        before: null,
        after: {
          rowId,
          key: draftRow.key,
          value: combo.value,
          target: combo.target,
          customEnvironmentIds: combo.customEnvironmentIds,
        },
        undoToken: `undo:create-combo:${rowId}:${combo.valueId}`,
      });
    });
  });

  return operations;
}

function planUpdateOperations(
  baselineRows: Map<string, EnvMatrixDraft["rows"][number]>,
  draftRows: Map<string, EnvMatrixDraft["rows"][number]>,
): EnvOperation[] {
  const operations: EnvOperation[] = [];

  draftRows.forEach((draftRow, rowId) => {
    const baselineRow = baselineRows.get(rowId);
    if (!baselineRow) {
      return;
    }

    const baselinePrimaryValue = baselineRow.values[0]?.content ?? "";
    const draftPrimaryValue = draftRow.values[0]?.content ?? "";
    const requiresUpdate = baselineRow.key !== draftRow.key || baselinePrimaryValue !== draftPrimaryValue;

    if (!requiresUpdate) {
      return;
    }

    baselineRow.sourceRows.forEach((sourceRow) => {
      operations.push({
        id: `update-row:${sourceRow.id}`,
        kind: "update_env",
        summary: `Update existing env row ${sourceRow.id}`,
        rowId,
        before: {
          rowId,
          key: baselineRow.key,
          value: sourceRow.value,
          target: sourceRow.target,
          customEnvironmentIds: sourceRow.customEnvironmentIds,
        },
        after: {
          rowId,
          key: draftRow.key,
          value: draftPrimaryValue,
          target: sourceRow.target,
          customEnvironmentIds: sourceRow.customEnvironmentIds,
        },
        undoToken: `undo:update-row:${sourceRow.id}`,
      });
    });
  });

  return operations;
}

function planDeleteOperations(
  baselineRows: Map<string, EnvMatrixDraft["rows"][number]>,
  draftRows: Map<string, EnvMatrixDraft["rows"][number]>,
): EnvOperation[] {
  const operations: EnvOperation[] = [];

  baselineRows.forEach((baselineRow, rowId) => {
    const draftRow = draftRows.get(rowId);
    const desiredSignatures = draftRow
      ? new Set(getDesiredCombos(draftRow).map((combo) => toComboSignature(combo)))
      : new Set<string>();

    baselineRow.sourceRows.forEach((sourceRow) => {
      const signature = toComboSignature({
        valueId: sourceRow.id,
        value: sourceRow.value,
        target: sourceRow.target,
        customEnvironmentIds: sourceRow.customEnvironmentIds,
      });

      if (desiredSignatures.has(signature)) {
        return;
      }

      operations.push({
        id: `delete-row:${sourceRow.id}`,
        kind: "delete_env",
        summary: `Delete orphaned env row ${sourceRow.id}`,
        rowId,
        before: {
          rowId,
          key: baselineRow.key,
          value: sourceRow.value,
          target: sourceRow.target,
          customEnvironmentIds: sourceRow.customEnvironmentIds,
        },
        after: null,
        undoToken: `undo:delete-row:${sourceRow.id}`,
      });
    });
  });

  return operations;
}

export function planOperations(baseline: EnvMatrixDraft, draft: EnvMatrixDraft): PlannedOperations {
  const changes = detectDraftChanges(baseline, draft);
  const baselineRows = new Map(baseline.rows.map((row) => [row.rowId, row]));
  const draftRows = new Map(draft.rows.map((row) => [row.rowId, row]));

  const changeOperations: EnvOperation[] = changes
    .filter((change) => change.kind !== "update" && change.kind !== "delete")
    .map((change) => {
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

  const createOperations = planCreateOperations(baselineRows, draftRows);
  const updateOperations = planUpdateOperations(baselineRows, draftRows);
  const deleteOperations = planDeleteOperations(baselineRows, draftRows);
  const operationsById = new Map<string, EnvOperation>();

  [...changeOperations, ...createOperations, ...updateOperations, ...deleteOperations].forEach(
    (operation) => {
      operationsById.set(operation.id, operation);
    },
  );

  const operationOrder: Record<OperationKind, number> = {
    create_env: 0,
    update_env: 1,
    rename_key: 1,
    retarget: 1,
    delete_env: 2,
  };

  const orderedOperations = Array.from(operationsById.values()).sort((left, right) => {
    return operationOrder[left.kind] - operationOrder[right.kind] || left.id.localeCompare(right.id);
  });

  return { operations: orderedOperations };
}
