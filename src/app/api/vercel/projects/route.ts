import { NextResponse, type NextRequest } from "next/server";

import {
  VercelCliError,
  getVercelCliAuthStatus,
  listVercelProjects,
  listVercelTeamScopes,
} from "@/lib/vercel-cli";

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const scopeId = request.nextUrl.searchParams.get("scopeId")?.trim() ?? "";
  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

  if (!scopeId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "bad_request",
          message: "scopeId is required.",
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

    const scope = await resolveScopeForCli(scopeId);
    const projects = await listVercelProjects(scope, search);

    return NextResponse.json({
      ok: true,
      data: {
        projects,
      },
    });
  } catch (error) {
    if (error instanceof VercelCliError && error.details.code === "cli_non_zero_exit") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "unauthorized",
            message: "Unable to load projects from CLI scope. Check `vercel whoami` and `vercel switch`.",
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
          message: "Unable to load projects right now.",
        },
      },
      { status: 500 },
    );
  }
}
