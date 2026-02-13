import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import type { EnvOperation } from "@/lib/env-model";
import type { ApplyOperationResult, ApplyResultData } from "@/lib/types";
import {
  ApplyLockConflictError,
  buildCliApplyActions,
  ensureProjectWorkspace,
  executeCliAddActions,
  getVercelCliAuthStatus,
  linkVercelProjectWorkspace,
  loadProjectSnapshotFromCli,
  resolveCliScopeFromScopeId,
  withProjectApplyLock,
} from "@/lib/vercel-cli";

const operationKindSchema = z.enum(["create_env", "update_env", "delete_env", "rename_key", "retarget"]);
const targetSchema = z.array(z.enum(["production", "preview", "development"]));

const operationSnapshotSchema = z
  .object({
    rowId: z.string().trim().min(1),
    key: z.string().trim().min(1),
    value: z.string().optional(),
    target: targetSchema.optional(),
    customEnvironmentIds: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

const operationSchema = z
  .object({
    id: z.string().trim().min(1),
    kind: operationKindSchema,
    summary: z.string().trim().min(1),
    rowId: z.string().trim().min(1),
    before: operationSnapshotSchema.nullable(),
    after: operationSnapshotSchema.nullable(),
    undoToken: z.string().trim().min(1),
  })
  .strict();

const applyPayloadSchema = z
  .object({
    projectId: z.string().trim().min(1),
    scopeId: z.string().trim().min(1),
    baselineHash: z.string().trim().length(64),
    operations: z.array(operationSchema),
  })
  .strict();

function mergeActionResults(operationIds: string[], actionResults: Awaited<ReturnType<typeof executeCliAddActions>>): ApplyResultData {
  const results: ApplyOperationResult[] = operationIds.map((operationId) => {
    const perOperation = actionResults.filter((item) => item.operationId === operationId);

    if (perOperation.some((item) => item.status === "failed")) {
      const message = perOperation
        .filter((item) => item.message)
        .map((item) => item.message)
        .join("; ");

      return {
        operationId,
        status: "failed",
        createdId: null,
        message: message.length > 0 ? message : "Operation failed.",
      } satisfies ApplyOperationResult;
    }

    if (perOperation.every((item) => item.status === "skipped")) {
      const message = perOperation
        .filter((item) => item.message)
        .map((item) => item.message)
        .join("; ");

      return {
        operationId,
        status: "skipped",
        createdId: null,
        message: message.length > 0 ? message : "Operation skipped.",
      } satisfies ApplyOperationResult;
    }

    return {
      operationId,
      status: "done",
      createdId: null,
      message: null,
    } satisfies ApplyOperationResult;
  });

  return {
    accepted: operationIds.length,
    results,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = applyPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "bad_request",
          message: "Apply payload is invalid.",
        },
      },
      { status: 400 },
    );
  }

  try {
    return await withProjectApplyLock(parsed.data.projectId, parsed.data.scopeId, async () => {
      const authStatus = await getVercelCliAuthStatus();
      if (!authStatus.authenticated) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "unauthorized",
              message: authStatus.message,
            },
          },
          { status: 401 },
        );
      }

      const currentSnapshot = await loadProjectSnapshotFromCli({
        projectId: parsed.data.projectId,
        scopeId: parsed.data.scopeId,
      });

      if (currentSnapshot.baselineHash !== parsed.data.baselineHash) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "conflict",
              message: "Baseline changed. Reload the latest snapshot before applying.",
            },
          },
          { status: 409 },
        );
      }

      const resolvedScope = await resolveCliScopeFromScopeId(parsed.data.scopeId);
      const workspacePath = await ensureProjectWorkspace({
        projectId: parsed.data.projectId,
        scopeKey: resolvedScope.scopeCacheKey,
      });

      await linkVercelProjectWorkspace({
        workspacePath,
        project: parsed.data.projectId,
        scope: resolvedScope.scopeArg,
      });

      const actions = buildCliApplyActions(parsed.data.operations as EnvOperation[]);
      const actionResults = await executeCliAddActions(
        {
          workspacePath,
          scope: resolvedScope.scopeArg,
          actions,
        },
      );

      const result = mergeActionResults(
        parsed.data.operations.map((operation) => operation.id),
        actionResults,
      );

      return NextResponse.json({
        ok: true,
        data: result,
      });
    });
  } catch (error) {
    if (error instanceof ApplyLockConflictError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "conflict",
            message: error.message,
          },
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "internal_error",
          message: "Unable to apply planned operations.",
        },
      },
      { status: 500 },
    );
  }
}
