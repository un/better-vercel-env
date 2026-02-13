import type { EnvOperation } from "@/lib/env-model";
import type { ApplyOperationResult, ApplyResultData } from "@/lib/types";

interface LegacyVercelLikeClient {
  projects: {
    createProjectEnv(input: unknown): Promise<unknown>;
    editProjectEnv(input: unknown): Promise<unknown>;
    removeProjectEnv(input: unknown): Promise<unknown>;
  };
}

export interface ApplyOperationsInput {
  client: LegacyVercelLikeClient;
  projectId: string;
  teamId?: string;
  operations: EnvOperation[];
}

export type ApplyOperationsResult = ApplyResultData;

function getOperationRowId(operation: EnvOperation, prefix: string): string | null {
  return operation.id.startsWith(prefix) ? operation.id.slice(prefix.length) : null;
}

function sanitizeErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Operation failed.";
}

function extractCreatedId(response: unknown): string | null {
  if (typeof response !== "object" || response === null) {
    return null;
  }

  if ("id" in response && typeof (response as { id?: unknown }).id === "string") {
    return (response as { id: string }).id;
  }

  if (
    "created" in response &&
    typeof (response as { created?: unknown }).created === "object" &&
    (response as { created: { id?: unknown } }).created !== null &&
    typeof (response as { created: { id?: unknown } }).created.id === "string"
  ) {
    return (response as { created: { id: string } }).created.id;
  }

  if (
    "envs" in response &&
    Array.isArray((response as { envs?: unknown }).envs) &&
    (response as { envs: Array<{ id?: unknown }> }).envs[0] &&
    typeof (response as { envs: Array<{ id?: unknown }> }).envs[0].id === "string"
  ) {
    return (response as { envs: Array<{ id: string }> }).envs[0].id;
  }

  return null;
}

export async function applyPlannedOperations({
  client,
  projectId,
  teamId,
  operations,
}: ApplyOperationsInput): Promise<ApplyOperationsResult> {
  const results: ApplyOperationResult[] = [];
  const createOperations = operations.filter((operation) => operation.kind === "create_env");
  const updateOperations = operations.filter((operation) => operation.kind === "update_env");
  const deleteOperations = operations.filter((operation) => operation.kind === "delete_env");
  const skippedOperations = operations.filter(
    (operation) =>
      operation.kind !== "create_env" && operation.kind !== "update_env" && operation.kind !== "delete_env",
  );

  for (const operation of createOperations) {
    try {
      const after = operation.after;
      if (!after?.value) {
        results.push({
          operationId: operation.id,
          status: "failed",
          createdId: null,
          message: "Create operation is missing value data.",
        });
        continue;
      }

      const response = await client.projects.createProjectEnv({
        idOrName: projectId,
        teamId,
        requestBody: {
          key: after.key,
          value: after.value,
          type: "plain",
          target: after.target ?? [],
          customEnvironmentIds: after.customEnvironmentIds,
        },
      });

      results.push({
        operationId: operation.id,
        status: "done",
        createdId: extractCreatedId(response),
        message: null,
      });
    } catch (error) {
      results.push({
        operationId: operation.id,
        status: "failed",
        createdId: null,
        message: sanitizeErrorMessage(error),
      });
    }
  }

  for (const operation of updateOperations) {
    const sourceRowId = getOperationRowId(operation, "update-row:");
    if (!sourceRowId || !operation.after) {
      results.push({
        operationId: operation.id,
        status: "failed",
        createdId: null,
        message: "Update operation is missing source row reference.",
      });
      continue;
    }

    try {
      await client.projects.editProjectEnv({
        idOrName: projectId,
        id: sourceRowId,
        teamId,
        requestBody: {
          key: operation.after.key,
          value: operation.after.value,
          type: "plain",
          target: operation.after.target,
          customEnvironmentIds: operation.after.customEnvironmentIds,
        },
      });

      results.push({
        operationId: operation.id,
        status: "done",
        createdId: null,
        message: null,
      });
    } catch (error) {
      results.push({
        operationId: operation.id,
        status: "failed",
        createdId: null,
        message: sanitizeErrorMessage(error),
      });
    }
  }

  for (const operation of deleteOperations) {
    const sourceRowId = getOperationRowId(operation, "delete-row:");
    if (!sourceRowId) {
      results.push({
        operationId: operation.id,
        status: "failed",
        createdId: null,
        message: "Delete operation is missing source row reference.",
      });
      continue;
    }

    try {
      await client.projects.removeProjectEnv({
        idOrName: projectId,
        id: sourceRowId,
        teamId,
      });

      results.push({
        operationId: operation.id,
        status: "done",
        createdId: null,
        message: null,
      });
    } catch (error) {
      results.push({
        operationId: operation.id,
        status: "failed",
        createdId: null,
        message: sanitizeErrorMessage(error),
      });
    }
  }

  for (const operation of skippedOperations) {
    results.push({
      operationId: operation.id,
      status: "skipped",
      createdId: null,
      message: `Operation kind ${operation.kind} is not executable yet.`,
    });
  }

  return {
    accepted: operations.length,
    results,
  };
}
