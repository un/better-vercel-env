import { listVercelProjects, resolveCliScopeFromScopeId } from "@/lib/vercel-cli";
import type { VercelProjectSummary } from "@/lib/types";

export async function loadProjectsFromCli(scopeId: string, search = ""): Promise<VercelProjectSummary[]> {
  const resolvedScope = await resolveCliScopeFromScopeId(scopeId);
  return listVercelProjects(resolvedScope.scopeArg, search);
}
