import type { VercelProjectSummary } from "@/lib/types";

import { defaultVercelCliRunner, type VercelCliCommandRunner } from "./index";

interface RawProjectLike {
  id?: unknown;
  name?: unknown;
  framework?: unknown;
  updatedAt?: unknown;
}

function parseProjectsJson(stdout: string): RawProjectLike[] {
  const parsed = JSON.parse(stdout) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as RawProjectLike[];
  }

  if (typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { projects?: unknown }).projects)) {
    return (parsed as { projects: RawProjectLike[] }).projects;
  }

  return [];
}

export function normalizeProjects(rawProjects: RawProjectLike[], search: string): VercelProjectSummary[] {
  const normalizedSearch = search.trim().toLowerCase();

  return rawProjects
    .map((project) => {
      if (typeof project.id !== "string" || typeof project.name !== "string") {
        return null;
      }

      return {
        id: project.id,
        name: project.name,
        framework: typeof project.framework === "string" ? project.framework : null,
        updatedAt: typeof project.updatedAt === "number" ? project.updatedAt : 0,
      } satisfies VercelProjectSummary;
    })
    .filter((project): project is VercelProjectSummary => Boolean(project))
    .filter((project) =>
      normalizedSearch.length === 0 ? true : project.name.toLowerCase().includes(normalizedSearch),
    )
    .sort((left, right) => right.updatedAt - left.updatedAt || left.name.localeCompare(right.name));
}

export async function listVercelProjects(
  scope: string,
  search = "",
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<VercelProjectSummary[]> {
  const result = await runner.run({
    executable: "vercel",
    args: ["project", "list", "--scope", scope, "--json", "--no-color"],
    timeoutMs: 20_000,
  });

  return normalizeProjects(parseProjectsJson(result.stdout), search);
}
