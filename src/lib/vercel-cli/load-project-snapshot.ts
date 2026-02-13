import { promises as fs } from "node:fs";

import { hashProjectSnapshot } from "../vercel/project-snapshot";
import type { ProjectEnvSnapshot } from "@/lib/types";

import {
  buildSnapshotFromPulledEnvs,
  ensureProjectWorkspace,
  linkVercelProjectWorkspace,
  listVercelTeamScopes,
  parseDotenvFile,
  pullAllBuiltInEnvironments,
  withWorkspaceLock,
} from "./index";

interface LoadSnapshotInput {
  projectId: string;
  scopeId: string;
}

async function resolveScopeForCli(scopeId: string): Promise<string> {
  if (scopeId.startsWith("user:")) {
    return scopeId.replace("user:", "");
  }

  if (scopeId.startsWith("team:")) {
    return scopeId.replace("team:", "");
  }

  const teams = await listVercelTeamScopes();
  const team = teams.find((item) => item.id === scopeId);
  return team ? team.slug : scopeId;
}

export async function loadProjectSnapshotFromCli(input: LoadSnapshotInput): Promise<ProjectEnvSnapshot> {
  const scope = await resolveScopeForCli(input.scopeId);
  const workspacePath = await ensureProjectWorkspace({
    projectId: input.projectId,
    scope,
  });

  const snapshotBase = await withWorkspaceLock(workspacePath, async () => {
    await linkVercelProjectWorkspace({
      workspacePath,
      project: input.projectId,
      scope,
    });

    const pulledFiles = await pullAllBuiltInEnvironments(workspacePath, scope);

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

      return buildSnapshotFromPulledEnvs(input.projectId, mapByEnvironment);
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
