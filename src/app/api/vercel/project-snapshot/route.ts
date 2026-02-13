import { NextResponse, type NextRequest } from "next/server";

import { createVercelClientFromRequest, SessionAuthError } from "@/lib/vercel/client";
import { loadProjectSnapshot } from "@/lib/vercel/project-snapshot";

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

    const snapshot = await loadProjectSnapshot(client, projectId, teamId);

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
