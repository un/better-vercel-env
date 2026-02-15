import { Box, Text, createCliRenderer } from "@opentui/core";
import { pathToFileURL } from "node:url";

import { getVercelCliAuthStatus } from "@/lib/vercel-cli";
import { normalizeSnapshotToDraft } from "@/lib/env-model";

import { loadProjectsFromCli } from "./data/projects";
import { loadScopesFromCli } from "./data/scopes";
import { loadSnapshotForSelection } from "./data/snapshot";
import { handleGlobalKeySequence } from "./keyboard/global-keys";
import { registerRendererLifecycle } from "./lifecycle";
import { AuthScreen, type AuthScreenModel } from "./screens/auth-screen";
import { PickerScreen } from "./screens/picker-screen";
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

  const renderCurrentScreen = () => {
    const state = store.getState();

    if (state.screen === "auth") {
      replaceRootContent(renderer, AuthScreen(authScreenModel));
      return;
    }

    if (state.screen === "picker") {
      replaceRootContent(
        renderer,
        PickerScreen({
          scopes: state.scopes,
          projects: state.projects,
          activeScopeId: state.selection.scopeId,
          activeProjectId: state.selection.projectId,
          statusMessage: state.status.message ?? "Select scope and project",
        }),
      );
      return;
    }

    replaceRootContent(
      renderer,
      Box(
        {
          width: "100%",
          height: "100%",
          flexDirection: "column",
          padding: 1,
          borderStyle: "rounded",
        },
        Text({ content: "Editor placeholder" }),
        Text({ content: `Project: ${state.selection.projectId ?? "-"}` }),
        Text({ content: `Snapshot rows: ${state.editor.snapshot?.records.length ?? 0}` }),
        Text({ content: `Baseline hash: ${state.editor.draft?.baselineHash ?? "-"}` }),
        Text({ content: `Status: ${state.status.message ?? "-"}` }),
      ),
    );
  };

  const setStatusMessage = (message: string | null, error: string | null = null) => {
    const state = store.getState();
    store.patchState({
      status: {
        ...state.status,
        message,
        error,
      },
    });
  };

  const loadProjectsForScope = async (scopeId: string) => {
    const projects = await loadProjectsFromCli(scopeId, "");
    const state = store.getState();
    store.patchState({
      projects,
      selection: {
        ...state.selection,
        scopeId,
        projectId: projects[0]?.id ?? null,
      },
    });
  };

  const cycleScope = async (offset: number) => {
    const state = store.getState();
    if (state.scopes.length === 0) {
      return;
    }

    const currentIndex = Math.max(
      0,
      state.scopes.findIndex((scope) => scope.id === state.selection.scopeId),
    );
    const nextIndex = (currentIndex + offset + state.scopes.length) % state.scopes.length;
    const nextScope = state.scopes[nextIndex];
    if (!nextScope) {
      return;
    }

    setStatusMessage(`Loading projects for ${nextScope.slug}...`);
    renderCurrentScreen();

    try {
      await loadProjectsForScope(nextScope.id);
      setStatusMessage(`Loaded projects for ${nextScope.slug}.`);
    } catch (error) {
      setStatusMessage(null, error instanceof Error ? error.message : "Unable to load projects for scope.");
    }

    renderCurrentScreen();
  };

  const cycleProject = (offset: number) => {
    const state = store.getState();
    if (state.projects.length === 0) {
      return;
    }

    const currentIndex = Math.max(
      0,
      state.projects.findIndex((project) => project.id === state.selection.projectId),
    );
    const nextIndex = (currentIndex + offset + state.projects.length) % state.projects.length;
    const nextProject = state.projects[nextIndex];
    if (!nextProject) {
      return;
    }

    store.patchState({
      selection: {
        ...state.selection,
        projectId: nextProject.id,
      },
      status: {
        ...state.status,
        message: `Selected project ${nextProject.name}.`,
      },
    });

    renderCurrentScreen();
  };

  const openEditorForSelection = async () => {
    const state = store.getState();
    if (!state.selection.scopeId || !state.selection.projectId) {
      setStatusMessage("Select a scope and project before continuing.");
      renderCurrentScreen();
      return;
    }

    setStatusMessage("Loading project snapshot...");
    renderCurrentScreen();

    try {
      const snapshot = await loadSnapshotForSelection(state.selection.projectId, state.selection.scopeId);
      const normalized = normalizeSnapshotToDraft(snapshot);
      store.patchState({
        editor: {
          ...state.editor,
          snapshot,
          baseline: normalized,
          draft: structuredClone(normalized),
        },
      });
      store.transitionTo("editor");
      setStatusMessage("Snapshot loaded.");
    } catch (error) {
      setStatusMessage(null, error instanceof Error ? error.message : "Unable to load project snapshot.");
    }

    renderCurrentScreen();
  };

  const refreshAuthStatus = async () => {
    authScreenModel.loading = true;
    authScreenModel.error = null;
    authScreenModel.message = "Refreshing CLI authentication status...";
    store.patchState({ screen: "auth" });
    renderCurrentScreen();

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
            screen: "picker",
            selection: {
              scopeId: scopes[0].id,
              projectId: projects[0]?.id ?? null,
            },
            status: {
              loading: false,
              message: `Loaded ${scopes.length} scope${scopes.length === 1 ? "" : "s"} and ${projects.length} project${projects.length === 1 ? "" : "s"}.`,
              error: null,
            },
          });
          authScreenModel.message = "CLI session active.";
        } else {
          authScreenModel.message = `CLI session active. Loaded ${scopes.length} scope${scopes.length === 1 ? "" : "s"}.`;
        }
      } catch (error) {
        authScreenModel.error = error instanceof Error ? error.message : "Unable to load scopes.";
      }
    }

    renderCurrentScreen();
  };

  renderCurrentScreen();

  renderer.addInputHandler((sequence) => {
    const state = store.getState();
    if (state.screen !== "picker") {
      return false;
    }

    if (sequence === "\t") {
      void cycleScope(1);
      return true;
    }

    if (sequence === "j" || sequence === "\u001b[B") {
      cycleProject(1);
      return true;
    }

    if (sequence === "k" || sequence === "\u001b[A") {
      cycleProject(-1);
      return true;
    }

    if (sequence === "\r" || sequence === "\n") {
      if (!state.selection.projectId) {
        return true;
      }

      void openEditorForSelection();
      return true;
    }

    return false;
  });

  renderer.addInputHandler((sequence) => {
    return handleGlobalKeySequence(sequence, {
      onQuit: () => {
        lifecycle.shutdown("keyboard");
        lifecycle.dispose();
        process.exit(0);
      },
      onHelp: () => {
        process.stderr.write("Keys: q quit, r refresh auth, tab scope, j/k project, enter continue\n");
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
