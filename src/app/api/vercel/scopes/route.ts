import { NextResponse } from "next/server";

import { VercelCliError, getVercelCliAuthStatus, listVercelTeamScopes } from "@/lib/vercel-cli";
import type { VercelScopeSummary } from "@/lib/types";

export async function GET(): Promise<NextResponse> {
  try {
    const authStatus = await getVercelCliAuthStatus();
    if (!authStatus.authenticated || !authStatus.identity) {
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

    const teams = await listVercelTeamScopes();

    const personalScope: VercelScopeSummary = {
      id: `user:${authStatus.identity.username}`,
      slug: authStatus.identity.username,
      name: "Personal",
      type: "personal",
    };

    const teamScopes: VercelScopeSummary[] = teams.map((team) => ({
      id: team.id,
      slug: team.slug,
      name: team.name,
      type: "team",
    }));

    return NextResponse.json({
      ok: true,
      data: {
        scopes: [personalScope, ...teamScopes],
      },
    });
  } catch (error) {
    if (error instanceof VercelCliError && error.details.code === "cli_non_zero_exit") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "unauthorized",
            message: "Run `vercel login` to authenticate CLI, then refresh.",
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
          message: "Unable to load scopes right now.",
        },
      },
      { status: 500 },
    );
  }
}
