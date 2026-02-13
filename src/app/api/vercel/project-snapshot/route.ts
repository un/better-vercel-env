import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createVercelClientFromRequest, SessionAuthError } from "@/lib/vercel/client";
import { getProjectEnvRecords } from "@/lib/vercel/env-records";
import { getProjectEnvironments } from "@/lib/vercel/environments";
import type { ProjectEnvSnapshot } from "@/lib/types";

function hashSnapshot(snapshot: Omit<ProjectEnvSnapshot, "baselineHash">): string {
  const stablePayload = {
    projectId: snapshot.projectId,
    environments: [...snapshot.environments].sort((left, right) => left.id.localeCompare(right.id)),
    records: [...snapshot.records].sort((left, right) => left.id.localeCompare(right.id)),
  };

  return createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex");
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const projectId = request.nextUrl.searchParams.get("projectId")?.trim() ?? "";
  const scopeId = request.nextUrl.searchParams.get("scopeId")?.trim() ?? "";

  if (!projectId || !scopeId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "bad_request",
          message: "projectId and scopeId are required.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const client = createVercelClientFromRequest(request);
    const teamId = scopeId.startsWith("user:") ? undefined : scopeId;

    const [environments, records] = await Promise.all([
      getProjectEnvironments(client, projectId, teamId),
      getProjectEnvRecords(client, projectId, teamId),
    ]);

    const snapshotBase = {
      projectId,
      environments,
      records,
    };

    const snapshot: ProjectEnvSnapshot = {
      ...snapshotBase,
      baselineHash: hashSnapshot(snapshotBase),
    };

    return NextResponse.json({
      ok: true,
      data: snapshot,
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
          message: "Unable to compose project snapshot.",
        },
      },
      { status: 500 },
    );
  }
}
