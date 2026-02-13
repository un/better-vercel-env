import { createHash } from "node:crypto";
import type { Vercel } from "@vercel/sdk";

import { getProjectEnvRecords } from "@/lib/vercel/env-records";
import { getProjectEnvironments } from "@/lib/vercel/environments";
import type { ProjectEnvSnapshot } from "@/lib/types";

type SnapshotBase = Omit<ProjectEnvSnapshot, "baselineHash">;

export function hashProjectSnapshot(snapshot: SnapshotBase): string {
  const stablePayload = {
    projectId: snapshot.projectId,
    environments: [...snapshot.environments].sort((left, right) => left.id.localeCompare(right.id)),
    records: [...snapshot.records].sort((left, right) => left.id.localeCompare(right.id)),
  };

  return createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex");
}

export async function loadProjectSnapshot(
  client: Vercel,
  projectId: string,
  teamId?: string,
): Promise<ProjectEnvSnapshot> {
  const [environments, records] = await Promise.all([
    getProjectEnvironments(client, projectId, teamId),
    getProjectEnvRecords(client, projectId, teamId),
  ]);

  const snapshotBase: SnapshotBase = {
    projectId,
    environments,
    records,
    capabilities: {
      supportsCustomEnvironments: true,
      supportsBranchSpecificWrites: true,
    },
  };

  return {
    ...snapshotBase,
    baselineHash: hashProjectSnapshot(snapshotBase),
  };
}
