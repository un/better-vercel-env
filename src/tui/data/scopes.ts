import { getVercelCliAuthStatus, listVercelTeamScopes } from "@/lib/vercel-cli";
import type { VercelScopeSummary } from "@/lib/types";

export async function loadScopesFromCli(): Promise<VercelScopeSummary[]> {
  const authStatus = await getVercelCliAuthStatus();

  if (!authStatus.authenticated || !authStatus.identity) {
    throw new Error(authStatus.message);
  }

  const personalScope: VercelScopeSummary = {
    id: `user:${authStatus.identity.username}`,
    slug: authStatus.identity.username,
    name: "Personal",
    type: "personal",
  };

  const teamScopes = (await listVercelTeamScopes()).map((team) => ({
    id: team.id,
    slug: team.slug,
    name: team.name,
    type: "team" as const,
  }));

  return [personalScope, ...teamScopes];
}
