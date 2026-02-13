import type { Vercel } from "@vercel/sdk";

import type { EnvironmentColumn } from "@/lib/types";

const BUILT_IN_ENVIRONMENTS: EnvironmentColumn[] = [
  {
    id: "production",
    name: "Production",
    kind: "built_in",
    customEnvironmentId: null,
  },
  {
    id: "preview",
    name: "Preview",
    kind: "built_in",
    customEnvironmentId: null,
  },
  {
    id: "development",
    name: "Development",
    kind: "built_in",
    customEnvironmentId: null,
  },
];

export async function getProjectEnvironments(
  client: Vercel,
  projectId: string,
  teamId?: string,
): Promise<EnvironmentColumn[]> {
  const response = await client.environment.getV9ProjectsIdOrNameCustomEnvironments({
    idOrName: projectId,
    teamId,
  });

  const customRows = (response.environments ?? [])
    .map((environment) => ({
      id: `custom:${environment.id}` as const,
      name: environment.slug,
      kind: "custom" as const,
      customEnvironmentId: environment.id,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return [...BUILT_IN_ENVIRONMENTS, ...customRows];
}
