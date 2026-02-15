import { Box, Text } from "@opentui/core";

export interface AuthScreenModel {
  loading: boolean;
  authenticated: boolean;
  username: string | null;
  activeScope: string | null;
  message: string;
  error: string | null;
}

function statusLabel(model: AuthScreenModel): string {
  if (model.loading) {
    return "Checking CLI auth status...";
  }

  if (model.authenticated) {
    return "Authenticated";
  }

  return "Not authenticated";
}

export function AuthScreen(model: AuthScreenModel) {
  return Box(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      padding: 1,
      gap: 1,
      borderStyle: "rounded",
    },
    Text({ content: "Better Vercel Env (OpenTUI)" }),
    Text({ content: `Status: ${statusLabel(model)}` }),
    Text({ content: `Message: ${model.message}` }),
    Text({ content: model.username ? `User: ${model.username}` : "User: -" }),
    Text({ content: model.activeScope ? `Scope: ${model.activeScope}` : "Scope: -" }),
    Text({ content: model.error ? `Error: ${model.error}` : "Error: -" }),
    Text({ content: "Actions: r refresh, q quit, ? help" }),
    Text({ content: "If not authenticated run: vercel login" }),
  );
}
