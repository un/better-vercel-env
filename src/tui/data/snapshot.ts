import { loadProjectSnapshotFromCli } from "@/lib/vercel-cli";
import type { ProjectEnvSnapshot } from "@/lib/types";

export async function loadSnapshotForSelection(projectId: string, scopeId: string): Promise<ProjectEnvSnapshot> {
  return loadProjectSnapshotFromCli({ projectId, scopeId });
}
