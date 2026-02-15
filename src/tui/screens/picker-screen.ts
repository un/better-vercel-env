import { Box, Text } from "@opentui/core";

import type { VercelProjectSummary, VercelScopeSummary } from "@/lib/types";

export interface PickerScreenModel {
  scopes: VercelScopeSummary[];
  projects: VercelProjectSummary[];
  activeScopeId: string | null;
  activeProjectId: string | null;
  statusMessage: string;
  keyHints: string;
}

function formatScope(scope: VercelScopeSummary, isActive: boolean): string {
  return `${isActive ? ">" : " "} ${scope.name} (${scope.slug})`;
}

function formatProject(project: VercelProjectSummary, isActive: boolean): string {
  return `${isActive ? ">" : " "} ${project.name} [${project.framework ?? "no framework"}]`;
}

export function PickerScreen(model: PickerScreenModel) {
  const scopeLines =
    model.scopes.length === 0
      ? ["  No scopes loaded"]
      : model.scopes.map((scope) => formatScope(scope, scope.id === model.activeScopeId));

  const projectLines =
    model.projects.length === 0
      ? ["  No projects loaded"]
      : model.projects.map((project) => formatProject(project, project.id === model.activeProjectId));

  return Box(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      padding: 1,
      gap: 1,
      borderStyle: "rounded",
    },
    Text({ content: "Scope + Project Picker" }),
    Text({ content: `Status: ${model.statusMessage}` }),
    Text({ content: "Scopes" }),
    Text({ content: scopeLines.join("\n") }),
    Text({ content: "Projects" }),
    Text({ content: projectLines.join("\n") }),
    Text({ content: model.keyHints }),
  );
}
