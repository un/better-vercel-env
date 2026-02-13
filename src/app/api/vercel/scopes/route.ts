import { NextResponse, type NextRequest } from "next/server";

import { createVercelClientFromRequest, SessionAuthError } from "@/lib/vercel/client";
import type { VercelScopeSummary } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const client = createVercelClientFromRequest(request);
    const [user, teamsResult] = await Promise.all([
      client.user.getAuthUser(),
      client.teams.getTeams({ limit: 100 }),
    ]);

    const authUser = user?.user;

    const personalScope: VercelScopeSummary = {
      id: authUser?.id ? `user:${authUser.id}` : "user:personal",
      slug: authUser?.username ?? "personal",
      name: authUser?.name ?? "Personal",
      type: "personal",
    };

    const teamScopes: VercelScopeSummary[] = teamsResult.teams.map((team) => ({
      id: team.id,
      slug: team.slug,
      name: team.name ?? team.slug,
      type: "team",
    }));

    return NextResponse.json({
      ok: true,
      data: {
        scopes: [personalScope, ...teamScopes],
      },
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

    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    if (statusCode === 401 || statusCode === 403) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "unauthorized",
            message: "Token is invalid or has insufficient permissions.",
          },
        },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "internal_error",
          message: "Unable to load scopes right now.",
        },
      },
      { status: 500 },
    );
  }
}
