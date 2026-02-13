import type { Vercel } from "@vercel/sdk";

import type { BuiltInEnvironmentId, RawVercelEnvRecord } from "@/lib/types";

function normalizeTarget(value: unknown): BuiltInEnvironmentId[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is BuiltInEnvironmentId =>
        item === "production" || item === "preview" || item === "development",
    );
  }

  if (value === "production" || value === "preview" || value === "development") {
    return [value];
  }

  return [];
}

function normalizeProjectEnvsResponse(response: unknown): RawVercelEnvRecord[] {
  const rawItems =
    Array.isArray(response)
      ? response
      : typeof response === "object" && response !== null && "envs" in response
        ? ((response as { envs?: unknown }).envs ?? [])
        : [];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const type = item.type === "encrypted" ? "encrypted" : "plain";

      return {
        id: typeof item.id === "string" ? item.id : "",
        key: typeof item.key === "string" ? item.key : "",
        value: typeof item.value === "string" ? item.value : "",
        type,
        target: normalizeTarget(item.target),
        customEnvironmentIds: Array.isArray(item.customEnvironmentIds)
          ? item.customEnvironmentIds.filter((envId): envId is string => typeof envId === "string")
          : [],
        comment: typeof item.comment === "string" ? item.comment : null,
        gitBranch: typeof item.gitBranch === "string" ? item.gitBranch : null,
        system: item.type === "system" || item.system === true,
      } satisfies RawVercelEnvRecord;
    })
    .filter((item) => item.id.length > 0 && item.key.length > 0);
}

export async function getProjectEnvRecords(
  client: Vercel,
  projectId: string,
  teamId?: string,
): Promise<RawVercelEnvRecord[]> {
  const response = await client.projects.filterProjectEnvs({
    idOrName: projectId,
    decrypt: "true",
    teamId,
  });

  return normalizeProjectEnvsResponse(response);
}
