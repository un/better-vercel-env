import type { EnvOperation } from "@/lib/env-model";
import type { ApplyResultData } from "@/lib/types";
import {
  buildCliApplyActions,
  ensureProjectWorkspace,
  executeCliAddActions,
  linkVercelProjectWorkspace,
  loadProjectSnapshotFromCli,
  resolveCliScopeFromScopeId,
  withWorkspaceLock,
} from "@/lib/vercel-cli";

interface ExecuteApplyForSelectionInput {
  projectId: string;
  scopeId: string;
  expectedBaselineHash: string;
  operations: EnvOperation[];
}

export class BaselineConflictError extends Error {
  constructor(message = "Snapshot changed since load. Reload before applying.") {
    super(message);
    this.name = "BaselineConflictError";
  }
}

export async function executeApplyForSelection(input: ExecuteApplyForSelectionInput): Promise<ApplyResultData> {
  const latestSnapshot = await loadProjectSnapshotFromCli({
    projectId: input.projectId,
    scopeId: input.scopeId,
  });

  if (latestSnapshot.baselineHash !== input.expectedBaselineHash) {
    throw new BaselineConflictError(
      "Snapshot changed on Vercel since this draft loaded. Reload the project snapshot before applying.",
    );
  }

  const resolvedScope = await resolveCliScopeFromScopeId(input.scopeId);
  const workspacePath = await ensureProjectWorkspace({
    projectId: input.projectId,
    scopeKey: resolvedScope.scopeCacheKey,
  });

  const actions = buildCliApplyActions(input.operations);

  const actionResults = await withWorkspaceLock(workspacePath, async () => {
    await linkVercelProjectWorkspace({
      workspacePath,
      project: input.projectId,
      scope: resolvedScope.scopeArg,
    });

    return executeCliAddActions({
      workspacePath,
      scope: resolvedScope.scopeArg,
      actions,
    });
  });

  return {
    accepted: actions.length,
    results: actionResults.map((result) => ({
      operationId: result.operationId,
      status: result.status,
      createdId: null,
      message: result.message,
    })),
  };
}
