import { createCliRenderer } from "@opentui/core";
import { pathToFileURL } from "node:url";

import { getVercelCliAuthStatus } from "@/lib/vercel-cli";

import { loadProjectsFromCli } from "./data/projects";
import { loadScopesFromCli } from "./data/scopes";
import { handleGlobalKeySequence } from "./keyboard/global-keys";
import { registerRendererLifecycle } from "./lifecycle";
import { AuthScreen, type AuthScreenModel } from "./screens/auth-screen";
import { createTuiStore } from "./state";

function replaceRootContent(renderer: Awaited<ReturnType<typeof createCliRenderer>>, content: unknown): void {
  const existingChildren = [...renderer.root.getChildren()];
  existingChildren.forEach((child) => {
    renderer.root.remove(child.id);
  });
  renderer.root.add(content);
}

async function startTuiApp(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  });
  const store = createTuiStore();
  const lifecycle = registerRendererLifecycle(renderer);

  const authScreenModel: AuthScreenModel = {
    loading: true,
    authenticated: false,
    username: null,
    activeScope: null,
    message: "Checking Vercel CLI authentication...",
    error: null,
  };

  const renderAuth = () => {
    replaceRootContent(renderer, AuthScreen(authScreenModel));
  };

  const refreshAuthStatus = async () => {
    authScreenModel.loading = true;
    authScreenModel.error = null;
    authScreenModel.message = "Refreshing CLI authentication status...";
    renderAuth();

    const status = await getVercelCliAuthStatus();

    authScreenModel.loading = false;
    authScreenModel.authenticated = status.authenticated;
    authScreenModel.username = status.identity?.username ?? null;
    authScreenModel.activeScope = status.identity?.activeScope ?? null;
    authScreenModel.message = status.message;
    authScreenModel.error = null;

    if (status.authenticated) {
      try {
        const scopes = await loadScopesFromCli();
        store.patchState({
          scopes,
          selection: {
            scopeId: scopes[0]?.id ?? null,
            projectId: null,
          },
        });

        if (scopes[0]?.id) {
          const projects = await loadProjectsFromCli(scopes[0].id, "");
          store.patchState({
            projects,
          });
          authScreenModel.message = `CLI session active. Loaded ${scopes.length} scope${scopes.length === 1 ? "" : "s"} and ${projects.length} project${projects.length === 1 ? "" : "s"}.`;
        } else {
          authScreenModel.message = `CLI session active. Loaded ${scopes.length} scope${scopes.length === 1 ? "" : "s"}.`;
        }
      } catch (error) {
        authScreenModel.error = error instanceof Error ? error.message : "Unable to load scopes.";
      }
    }

    renderAuth();
  };

  renderAuth();

  renderer.addInputHandler((sequence) => {
    return handleGlobalKeySequence(sequence, {
      onQuit: () => {
        lifecycle.shutdown("keyboard");
        lifecycle.dispose();
        process.exit(0);
      },
      onHelp: () => {
        process.stderr.write("Keys: q quit, r refresh auth status, ? help\n");
      },
      onRefresh: () => {
        void refreshAuthStatus();
      },
      isTextInputMode: () => false,
    });
  });

  await refreshAuthStatus();

  if (process.env.VBE_TUI_SMOKE === "1") {
    lifecycle.shutdown("smoke");
    lifecycle.dispose();
  }
}

const isEntrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false;

if (isEntrypoint) {
  startTuiApp().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown startup error.";
    process.stderr.write(`Failed to start OpenTUI runtime: ${message}\n`);
    process.exit(1);
  });
}

export { startTuiApp };
