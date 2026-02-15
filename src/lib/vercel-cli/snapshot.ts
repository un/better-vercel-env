import { createHash } from "node:crypto";

import type {
  BuiltInEnvironmentId,
  EnvironmentColumn,
  ProjectEnvSnapshot,
  RawVercelEnvRecord,
} from "@/lib/types";

import type { VercelEnvTopologyRow } from "./env-list";
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

function envRecordId(key: string, target: BuiltInEnvironmentId[], ordinal = 0): string {
  const digest = createHash("sha1")
    .update(`${target.join(",")}::${key}::${ordinal}`)
    .digest("hex")
    .slice(0, 12);
  return `cli:${target.join("+")}:${digest}`;
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

function toRecords(
  maps: PulledEnvMapsByEnvironment,
  topologyRows: VercelEnvTopologyRow[] = [],
): RawVercelEnvRecord[] {
  const records: RawVercelEnvRecord[] = [];

  const editableMaps: PulledEnvMapsByEnvironment = {
    development: filterReservedRuntimeEnvKeys(maps.development).editable,
    preview: filterReservedRuntimeEnvKeys(maps.preview).editable,
    production: filterReservedRuntimeEnvKeys(maps.production).editable,
  };

  const coveredPairs = new Set<string>();

  const orderedTopologyRows = [...topologyRows].sort((left, right) => {
    return left.key.localeCompare(right.key) || left.target.join(",").localeCompare(right.target.join(","));
  });

  if (orderedTopologyRows.length > 0) {
    const keyTargetCount = new Map<string, number>();

    orderedTopologyRows.forEach((row) => {
      const key = row.key;
      const target = [...row.target].sort((left, right) => environmentOrder(left) - environmentOrder(right));
      if (target.length === 0) {
        return;
      }

      const value = target.map((environment) => editableMaps[environment][key]).find((item) => item !== undefined);
      if (typeof value !== "string") {
        return;
      }

      target.forEach((environment) => {
        coveredPairs.add(`${environment}::${key}`);
      });

      const idKey = `${key}::${target.join(",")}`;
      const nextOrdinal = (keyTargetCount.get(idKey) ?? 0) + 1;
      keyTargetCount.set(idKey, nextOrdinal);

      records.push({
        id: envRecordId(key, target, nextOrdinal),
        key,
        value,
        type: "plain",
        target,
        customEnvironmentIds: [],
        comment: null,
        gitBranch: null,
        system: false,
        readOnlyReason: null,
      });
    });
  }

  (Object.keys(editableMaps) as BuiltInEnvironmentId[]).forEach((environment) => {
    Object.keys(editableMaps[environment]).forEach((key) => {
      if (coveredPairs.has(`${environment}::${key}`)) {
        return;
      }

      records.push({
        id: envRecordId(key, [environment]),
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
  topologyRows: VercelEnvTopologyRow[] = [],
): Omit<ProjectEnvSnapshot, "baselineHash"> {
  return {
    projectId,
    environments: [...BUILT_IN_ENVIRONMENT_COLUMNS],
    records: toRecords(maps, topologyRows),
    capabilities: {
      supportsCustomEnvironments: false,
      supportsBranchSpecificWrites: false,
    },
  };
}
