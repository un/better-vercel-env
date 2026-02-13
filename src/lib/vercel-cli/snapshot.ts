import { createHash } from "node:crypto";

import type {
  BuiltInEnvironmentId,
  EnvironmentColumn,
  ProjectEnvSnapshot,
  RawVercelEnvRecord,
} from "@/lib/types";

import { filterReservedRuntimeEnvKeys } from "./reserved-keys";

export const BUILT_IN_ENVIRONMENT_COLUMNS: EnvironmentColumn[] = [
  {
    id: "production",
    name: "Production",
    kind: "built_in",
    customEnvironmentId: null,
  },
  {
    id: "preview",
    name: "Preview",
    kind: "built_in",
    customEnvironmentId: null,
  },
  {
    id: "development",
    name: "Development",
    kind: "built_in",
    customEnvironmentId: null,
  },
];

export type PulledEnvMapsByEnvironment = Record<BuiltInEnvironmentId, Record<string, string>>;

function envRecordId(key: string, environment: BuiltInEnvironmentId): string {
  const digest = createHash("sha1").update(`${environment}::${key}`).digest("hex").slice(0, 12);
  return `cli:${environment}:${digest}`;
}

function environmentOrder(environment: BuiltInEnvironmentId): number {
  if (environment === "production") {
    return 0;
  }

  if (environment === "preview") {
    return 1;
  }

  return 2;
}

function toRecords(maps: PulledEnvMapsByEnvironment): RawVercelEnvRecord[] {
  const records: RawVercelEnvRecord[] = [];

  const editableMaps: PulledEnvMapsByEnvironment = {
    development: filterReservedRuntimeEnvKeys(maps.development).editable,
    preview: filterReservedRuntimeEnvKeys(maps.preview).editable,
    production: filterReservedRuntimeEnvKeys(maps.production).editable,
  };

  (Object.keys(editableMaps) as BuiltInEnvironmentId[]).forEach((environment) => {
    Object.keys(editableMaps[environment]).forEach((key) => {
      records.push({
        id: envRecordId(key, environment),
        key,
        value: editableMaps[environment][key],
        type: "plain",
        target: [environment],
        customEnvironmentIds: [],
        comment: null,
        gitBranch: null,
        system: false,
        readOnlyReason: null,
      });
    });
  });

  return records.sort((left, right) => {
    const keyOrder = left.key.localeCompare(right.key);
    if (keyOrder !== 0) {
      return keyOrder;
    }

    return environmentOrder(left.target[0]) - environmentOrder(right.target[0]);
  });
}

export function buildSnapshotFromPulledEnvs(
  projectId: string,
  maps: PulledEnvMapsByEnvironment,
): Omit<ProjectEnvSnapshot, "baselineHash"> {
  return {
    projectId,
    environments: [...BUILT_IN_ENVIRONMENT_COLUMNS],
    records: toRecords(maps),
    capabilities: {
      supportsCustomEnvironments: false,
      supportsBranchSpecificWrites: false,
    },
  };
}
