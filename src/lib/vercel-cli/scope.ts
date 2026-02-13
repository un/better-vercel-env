import { listVercelTeamScopes } from "./teams";

export interface ResolvedCliScope {
  scopeArg: string | null;
  scopeCacheKey: string;
}

export async function resolveCliScopeFromScopeId(scopeId: string): Promise<ResolvedCliScope> {
  if (scopeId.startsWith("user:")) {
    return {
      scopeArg: null,
      scopeCacheKey: scopeId,
    };
  }

  if (scopeId.startsWith("team:")) {
    const slug = scopeId.replace("team:", "");
    return {
      scopeArg: slug,
      scopeCacheKey: `team:${slug}`,
    };
  }

  const teams = await listVercelTeamScopes();
  const team = teams.find((item) => item.id === scopeId);

  if (!team) {
    return {
      scopeArg: scopeId,
      scopeCacheKey: `unknown:${scopeId}`,
    };
  }

  return {
    scopeArg: team.slug,
    scopeCacheKey: `team:${team.slug}`,
  };
}
