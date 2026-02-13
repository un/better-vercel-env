import { NextResponse, type NextRequest } from "next/server";

import { createVercelClientFromRequest, SessionAuthError } from "@/lib/vercel/client";
import type { VercelProjectSummary } from "@/lib/types";

const MAX_PAGES = 10;
const PAGE_SIZE = "100";

interface RawProjectLike {
  id: string;
  name: string;
  framework?: string | null;
  updatedAt?: number;
}

function getProjectsFromResponse(response: unknown): RawProjectLike[] {
  if (Array.isArray(response)) {
    return response as RawProjectLike[];
  }

  if (typeof response === "object" && response !== null && "projects" in response) {
    const projects = (response as { projects?: unknown }).projects;
    if (Array.isArray(projects)) {
      return projects as RawProjectLike[];
    }
  }

  return [];
}

function getNextPageCursor(response: unknown): string | null {
  if (typeof response !== "object" || response === null || !("pagination" in response)) {
    return null;
  }

  const pagination = (response as { pagination?: { next?: string | number } }).pagination;
  if (!pagination) {
    return null;
  }

  return typeof pagination.next === "number" || typeof pagination.next === "string"
    ? String(pagination.next)
    : null;
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
    const client = createVercelClientFromRequest(request);
    const teamId = scopeId.startsWith("user:") ? undefined : scopeId;

    const projects: VercelProjectSummary[] = [];
    let from: string | undefined;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await client.projects.getProjects({
        teamId,
        from,
        limit: PAGE_SIZE,
        search: search || undefined,
      });

      const pageProjects = getProjectsFromResponse(result);

      pageProjects.forEach((project) => {
        projects.push({
          id: project.id,
          name: project.name,
          framework: project.framework ?? null,
          updatedAt: project.updatedAt ?? 0,
        });
      });

      const nextPage = getNextPageCursor(result);

      if (!nextPage) {
        break;
      }

      from = nextPage;
    }

    return NextResponse.json({
      ok: true,
      data: {
        projects,
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
          message: "Unable to load projects right now.",
        },
      },
      { status: 500 },
    );
  }
}
