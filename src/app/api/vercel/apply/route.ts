import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createVercelClientFromRequest, SessionAuthError } from "@/lib/vercel/client";
import { applyPlannedOperations } from "@/lib/vercel/apply";
import { loadProjectSnapshot } from "@/lib/vercel/project-snapshot";

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
    const client = createVercelClientFromRequest(request);
    const teamId = parsed.data.scopeId.startsWith("user:") ? undefined : parsed.data.scopeId;
    const currentSnapshot = await loadProjectSnapshot(client, parsed.data.projectId, teamId);

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

    const result = await applyPlannedOperations({
      client,
      projectId: parsed.data.projectId,
      teamId,
      operations: parsed.data.operations,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof SessionAuthError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "unauthorized",
            message: "Sign in with a valid token first.",
          },
        },
        { status: 401 },
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
