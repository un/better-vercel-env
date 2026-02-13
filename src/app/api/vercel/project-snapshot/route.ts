import { NextResponse, type NextRequest } from "next/server";

import { getVercelCliAuthStatus, loadProjectSnapshotFromCli } from "@/lib/vercel-cli";

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

    const snapshot = await loadProjectSnapshotFromCli({ projectId, scopeId });

    return NextResponse.json({
      ok: true,
      data: snapshot,
    });
  } catch {
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
