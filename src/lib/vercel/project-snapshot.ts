import { createHash } from "node:crypto";

import type { ProjectEnvSnapshot } from "@/lib/types";

type SnapshotBase = Omit<ProjectEnvSnapshot, "baselineHash">;

export function hashProjectSnapshot(snapshot: SnapshotBase): string {
  const stablePayload = {
    projectId: snapshot.projectId,
    capabilities: snapshot.capabilities,
    environments: [...snapshot.environments].sort((left, right) => left.id.localeCompare(right.id)),
    records: [...snapshot.records].sort((left, right) => left.id.localeCompare(right.id)),
  };

  return createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex");
}
