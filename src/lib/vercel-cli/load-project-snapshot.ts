import { promises as fs } from "node:fs";

import { hashProjectSnapshot } from "../vercel/project-snapshot";
import type { ProjectEnvSnapshot } from "@/lib/types";

import {
  buildSnapshotFromPulledEnvs,
  ensureProjectWorkspace,
  linkVercelProjectWorkspace,
  listVercelEnvTopology,
  parseDotenvFile,
  pullAllBuiltInEnvironments,
  resolveCliScopeFromScopeId,
  withWorkspaceLock,
} from "./index";

interface LoadSnapshotInput {
  projectId: string;
  scopeId: string;
}

export async function loadProjectSnapshotFromCli(input: LoadSnapshotInput): Promise<ProjectEnvSnapshot> {
  const resolvedScope = await resolveCliScopeFromScopeId(input.scopeId);
  const workspacePath = await ensureProjectWorkspace({
    projectId: input.projectId,
    scopeKey: resolvedScope.scopeCacheKey,
  });

  const snapshotBase = await withWorkspaceLock(workspacePath, async () => {
    await linkVercelProjectWorkspace({
      workspacePath,
      project: input.projectId,
      scope: resolvedScope.scopeArg,
    });

    const topologyRows = await listVercelEnvTopology(workspacePath, resolvedScope.scopeArg).catch(() => []);

    const pulledFiles = await pullAllBuiltInEnvironments(workspacePath, resolvedScope.scopeArg);

    try {
      const pulledByEnvironment = pulledFiles.reduce<Record<string, string>>((result, item) => {
        result[item.environment] = item.filePath;
        return result;
      }, {});

      const mapByEnvironment = {
        development: await parseDotenvFile(pulledByEnvironment.development),
        preview: await parseDotenvFile(pulledByEnvironment.preview),
        production: await parseDotenvFile(pulledByEnvironment.production),
      };

      return buildSnapshotFromPulledEnvs(input.projectId, mapByEnvironment, topologyRows);
    } finally {
      await Promise.all(
        pulledFiles.map(async (item) => {
          await fs.rm(item.filePath, { force: true });
        }),
      );
    }
  });

  return {
    ...snapshotBase,
    baselineHash: hashProjectSnapshot(snapshotBase),
  };
}
