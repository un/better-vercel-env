import type { ProjectEnvSnapshot, RawVercelEnvRecord } from "@/lib/types";

import type { EnvMatrixDraft, EnvMatrixRowDraft, ValuePoolEntry } from "./types";

function toValueSignature(record: RawVercelEnvRecord): string {
  return [
    record.value,
    record.type,
    record.comment ?? "",
    record.gitBranch ?? "",
    record.readOnlyReason ?? "",
  ].join("::");
}

function createEmptyAssignments(snapshot: ProjectEnvSnapshot): EnvMatrixRowDraft["assignments"] {
  return snapshot.environments.reduce<EnvMatrixRowDraft["assignments"]>((result, environment) => {
    result[environment.id] = null;
    return result;
  }, {} as EnvMatrixRowDraft["assignments"]);
}

function sortEnvironmentColumns(snapshot: ProjectEnvSnapshot): ProjectEnvSnapshot["environments"] {
  const builtInOrder = ["production", "preview", "development"];

  return [...snapshot.environments].sort((left, right) => {
    if (left.kind === "built_in" && right.kind === "built_in") {
      return builtInOrder.indexOf(left.id) - builtInOrder.indexOf(right.id);
    }

    if (left.kind === "built_in") {
      return -1;
    }

    if (right.kind === "built_in") {
      return 1;
    }

    return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
  });
}

function normalizeKeyGroup(key: string, records: RawVercelEnvRecord[], snapshot: ProjectEnvSnapshot): EnvMatrixRowDraft {
  const valueBySignature = new Map<string, ValuePoolEntry>();
  let valueCounter = 0;

  const assignments = createEmptyAssignments(snapshot);

  [...records].sort((left, right) => left.id.localeCompare(right.id)).forEach((record) => {
    const signature = toValueSignature(record);
    const existingValue = valueBySignature.get(signature);

    let valueEntry = existingValue;
    if (!valueEntry) {
      valueCounter += 1;
      valueEntry = {
        id: `value-${valueCounter}`,
        content: record.value,
        type: record.type,
        comment: record.comment,
        gitBranch: record.gitBranch,
        readOnlyReason: record.readOnlyReason,
        sourceRows: [],
      };
      valueBySignature.set(signature, valueEntry);
    }

    valueEntry.sourceRows.push({ rowId: record.id });

    record.target.forEach((target) => {
      assignments[target] = valueEntry.id;
    });

    record.customEnvironmentIds.forEach((customEnvironmentId) => {
      assignments[`custom:${customEnvironmentId}`] = valueEntry.id;
    });
  });

  const sortedValues = Array.from(valueBySignature.values()).sort((left, right) => {
    return (
      left.content.localeCompare(right.content) ||
      left.type.localeCompare(right.type) ||
      (left.comment ?? "").localeCompare(right.comment ?? "") ||
      (left.gitBranch ?? "").localeCompare(right.gitBranch ?? "") ||
      left.id.localeCompare(right.id)
    );
  });

  const valueIdMap = new Map<string, string>();
  const renumberedValues = sortedValues.map((value, index) => {
    const newId = `value-${index + 1}`;
    valueIdMap.set(value.id, newId);
    return {
      ...value,
      id: newId,
    };
  });

  const remappedAssignments = Object.entries(assignments).reduce<EnvMatrixRowDraft["assignments"]>(
    (result, [environmentId, valueId]) => {
      result[environmentId as keyof EnvMatrixRowDraft["assignments"]] =
        valueId ? valueIdMap.get(valueId) ?? valueId : null;
      return result;
    },
    {} as EnvMatrixRowDraft["assignments"],
  );

  return {
    rowId: `row:${key}`,
    key,
    values: renumberedValues,
    assignments: remappedAssignments,
    sourceRows: [...records].sort((left, right) => left.id.localeCompare(right.id)),
    isNew: false,
  };
}

export function normalizeSnapshotToDraft(snapshot: ProjectEnvSnapshot): EnvMatrixDraft {
  const rowsByKey = new Map<string, RawVercelEnvRecord[]>();

  snapshot.records.forEach((record) => {
    if (!rowsByKey.has(record.key)) {
      rowsByKey.set(record.key, []);
    }

    rowsByKey.get(record.key)?.push(record);
  });

  const orderedSnapshot = {
    ...snapshot,
    environments: sortEnvironmentColumns(snapshot),
  };

  const rows = Array.from(rowsByKey.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, records]) => normalizeKeyGroup(key, records, orderedSnapshot));

  const sourceRowIndex = snapshot.records.reduce<Record<string, RawVercelEnvRecord>>(
    (result, row) => {
      result[row.id] = row;
      return result;
    },
    {},
  );

  return {
    projectId: snapshot.projectId,
    environments: orderedSnapshot.environments,
    rows,
    sourceRowIndex,
    capabilities: snapshot.capabilities,
    baselineHash: snapshot.baselineHash,
  };
}
