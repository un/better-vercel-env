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

function normalizeKeyGroup(key: string, records: RawVercelEnvRecord[], snapshot: ProjectEnvSnapshot): EnvMatrixRowDraft {
  const valueBySignature = new Map<string, ValuePoolEntry>();
  let valueCounter = 0;

  const assignments = createEmptyAssignments(snapshot);

  records.forEach((record) => {
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

  return {
    rowId: `row:${key}`,
    key,
    values: Array.from(valueBySignature.values()),
    assignments,
    sourceRows: records,
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

  const rows = Array.from(rowsByKey.entries()).map(([key, records]) =>
    normalizeKeyGroup(key, records, snapshot),
  );

  const sourceRowIndex = snapshot.records.reduce<Record<string, RawVercelEnvRecord>>(
    (result, row) => {
      result[row.id] = row;
      return result;
    },
    {},
  );

  return {
    projectId: snapshot.projectId,
    environments: snapshot.environments,
    rows,
    sourceRowIndex,
    baselineHash: snapshot.baselineHash,
  };
}
