import { createCliRenderer } from "@opentui/core";
import { pathToFileURL } from "node:url";

import { getVercelCliAuthStatus } from "@/lib/vercel-cli";
import { normalizeSnapshotToDraft, type EnvMatrixDraft } from "@/lib/env-model";
import { APPLY_CONFIRM_PHRASE, isApplyConfirmPhraseValid } from "@/components/editor/confirm-gate";

import { loadProjectsFromCli } from "./data/projects";
import { BaselineConflictError, executeApplyForSelection } from "./data/apply";
import { loadScopesFromCli } from "./data/scopes";
import { loadSnapshotForSelection } from "./data/snapshot";
import { canEditAssignment, setRowAssignment, type AssignmentBlockReason } from "./editor/assignments";
import { computePendingOperations } from "./editor/planning";
import { undoRowDraftChange } from "./editor/undo";
import { addValueToDraft, editValueInDraft, removeValueFromDraft } from "./editor/value-pool";
import { handleGlobalKeySequence } from "./keyboard/global-keys";
import { registerRendererLifecycle } from "./lifecycle";
import { AuthScreen, type AuthScreenModel } from "./screens/auth-screen";
import { ConfirmScreen } from "./screens/confirm-screen";
import { EditorScreen } from "./screens/editor-screen";
import { PickerScreen } from "./screens/picker-screen";
import { ReportScreen } from "./screens/report-screen";
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
  let editorScrollOffset = 0;
  let selectedEditorRowIndex = 0;
  let selectedEditorValueIndex = 0;
  let selectedEditorEnvironmentIndex = 0;
  let keyEditBuffer: string | null = null;
  let valueEditBuffer: string | null = null;
  let confirmInput = "";

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

    if (state.screen === "confirm") {
      replaceRootContent(
        renderer,
        ConfirmScreen({
          expectedPhrase: APPLY_CONFIRM_PHRASE,
          input: confirmInput,
          ready: isApplyConfirmPhraseValid(confirmInput),
          pendingOperationCount: state.editor.pendingOperations.length,
          statusMessage: state.status.message ?? "Confirm to continue",
        }),
      );
      return;
    }

    if (state.screen === "report") {
      replaceRootContent(
        renderer,
        ReportScreen({
          report: state.applyReport,
          statusMessage: state.status.message ?? "Apply report",
        }),
      );
      return;
    }

    replaceRootContent(
      renderer,
      EditorScreen({
        baseline: state.editor.baseline,
        draft: state.editor.draft,
        scrollOffset: editorScrollOffset,
        selectedRowId: state.editor.draft?.rows[selectedEditorRowIndex]?.rowId ?? null,
        selectedValueId:
          state.editor.draft?.rows[selectedEditorRowIndex]?.values[Math.max(0, selectedEditorValueIndex)]?.id ?? null,
        selectedEnvironmentId:
          state.editor.draft?.environments[Math.max(0, selectedEditorEnvironmentIndex)]?.id ?? null,
        keyEditBuffer,
        valueEditBuffer,
        pendingOperations: state.editor.pendingOperations,
        statusMessage: state.status.message ?? "Ready",
      }),
    );
  };

  const patchEditorDraft = (nextDraft: EnvMatrixDraft) => {
    const state = store.getState();
    store.patchState({
      editor: {
        ...state.editor,
        draft: nextDraft,
        pendingOperations: computePendingOperations(state.editor.baseline, nextDraft),
      },
    });
  };

  const selectedEditorRow = () => {
    const draft = store.getState().editor.draft;
    if (!draft) {
      return null;
    }

    return draft.rows[selectedEditorRowIndex] ?? null;
  };

  const normalizeSelectedValueIndex = () => {
    const row = selectedEditorRow();
    const max = Math.max(0, (row?.values.length ?? 1) - 1);
    selectedEditorValueIndex = Math.min(Math.max(0, selectedEditorValueIndex), max);
  };

  const normalizeSelectedEnvironmentIndex = () => {
    const draft = store.getState().editor.draft;
    const max = Math.max(0, (draft?.environments.length ?? 1) - 1);
    selectedEditorEnvironmentIndex = Math.min(Math.max(0, selectedEditorEnvironmentIndex), max);
  };

  const assignmentBlockReasonMessage = (reason: AssignmentBlockReason): string => {
    if (reason === "custom_environment_unsupported") {
      return "Custom environment assignment edits are unsupported by this CLI capability set.";
    }

    if (reason === "branch_unsupported") {
      return "Row includes branch-specific values and assignments are read-only in this CLI mode.";
    }

    if (reason === "row_encrypted") {
      return "Row includes encrypted values and assignments are read-only.";
    }

    if (reason === "environment_missing") {
      return "Selected environment is no longer available.";
    }

    return "Selected value is no longer available.";
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
          pendingOperations: [],
        },
      });
      editorScrollOffset = 0;
      selectedEditorRowIndex = 0;
      selectedEditorValueIndex = 0;
      selectedEditorEnvironmentIndex = 0;
      keyEditBuffer = null;
      valueEditBuffer = null;
      confirmInput = "";
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

  const runApplyPipeline = async () => {
    const state = store.getState();
    if (!state.selection.projectId || !state.selection.scopeId) {
      setStatusMessage("Missing project or scope selection for apply.");
      renderCurrentScreen();
      return;
    }

    const expectedBaselineHash = state.editor.baseline?.baselineHash;
    if (!expectedBaselineHash) {
      setStatusMessage("Missing baseline snapshot. Reload project before applying.");
      renderCurrentScreen();
      return;
    }

    setStatusMessage(`Applying ${state.editor.pendingOperations.length} operation(s)...`);
    renderCurrentScreen();

    try {
      const report = await executeApplyForSelection({
        projectId: state.selection.projectId,
        scopeId: state.selection.scopeId,
        expectedBaselineHash,
        operations: state.editor.pendingOperations,
      });

      store.patchState({ applyReport: report });
      store.transitionTo("report");
      setStatusMessage("Apply finished.");
    } catch (error) {
      if (error instanceof BaselineConflictError) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage(null, error instanceof Error ? error.message : "Apply failed.");
      }
      store.transitionTo("editor");
    }

    renderCurrentScreen();
  };

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
    const state = store.getState();
    if (state.screen !== "editor") {
      return false;
    }

    const draft = state.editor.draft;
    const rows = draft?.rows ?? [];
    const environments = draft?.environments ?? [];
    const rowCount = rows.length;

    const commitKeyEdit = () => {
      if (!draft || keyEditBuffer === null) {
        return;
      }

      const selectedRow = rows[selectedEditorRowIndex];
      if (!selectedRow) {
        keyEditBuffer = null;
        return;
      }

      const nextKey = keyEditBuffer.trim();
      if (nextKey.length === 0) {
        setStatusMessage("Key cannot be empty.");
        keyEditBuffer = null;
        renderCurrentScreen();
        return;
      }

      const conflict = rows.some((row, index) => index !== selectedEditorRowIndex && row.key === nextKey);
      if (conflict) {
        setStatusMessage(`Key ${nextKey} already exists.`);
        keyEditBuffer = null;
        renderCurrentScreen();
        return;
      }

      const nextRows = rows.map((row, index) =>
        index === selectedEditorRowIndex
          ? {
              ...row,
              key: nextKey,
            }
          : row,
      );

      patchEditorDraft({
        ...draft,
        rows: nextRows,
      });

      setStatusMessage(`Renamed key to ${nextKey}.`);
      keyEditBuffer = null;
      renderCurrentScreen();
    };

    const commitValueEdit = () => {
      if (!draft || valueEditBuffer === null) {
        return;
      }

      const selectedRow = rows[selectedEditorRowIndex];
      const selectedValue = selectedRow?.values[Math.max(0, selectedEditorValueIndex)];
      if (!selectedRow || !selectedValue) {
        valueEditBuffer = null;
        return;
      }

      const nextDraft = editValueInDraft(draft, selectedRow.rowId, selectedValue.id, valueEditBuffer);
      if (!nextDraft.updated) {
        valueEditBuffer = null;
        return;
      }

      patchEditorDraft(nextDraft.draft);

      valueEditBuffer = null;
      setStatusMessage(`Updated value V${selectedEditorValueIndex + 1}.`);
      renderCurrentScreen();
    };

    if (keyEditBuffer !== null) {
      if (sequence === "\u001b") {
        keyEditBuffer = null;
        setStatusMessage("Cancelled key edit.");
        renderCurrentScreen();
        return true;
      }

      if (sequence === "\r" || sequence === "\n") {
        commitKeyEdit();
        return true;
      }

      if (sequence === "\u007f") {
        keyEditBuffer = keyEditBuffer.slice(0, -1);
        renderCurrentScreen();
        return true;
      }

      if (/^[a-zA-Z0-9_]$/.test(sequence)) {
        keyEditBuffer += sequence;
        renderCurrentScreen();
        return true;
      }

      return true;
    }

    if (valueEditBuffer !== null) {
      if (sequence === "\u001b") {
        valueEditBuffer = null;
        setStatusMessage("Cancelled value edit.");
        renderCurrentScreen();
        return true;
      }

      if (sequence === "\r" || sequence === "\n") {
        commitValueEdit();
        return true;
      }

      if (sequence === "\u007f") {
        valueEditBuffer = valueEditBuffer.slice(0, -1);
        renderCurrentScreen();
        return true;
      }

      if (/^[\x20-\x7E]$/.test(sequence)) {
        valueEditBuffer += sequence;
        renderCurrentScreen();
      }

      return true;
    }

    if (sequence === "j" || sequence === "\u001b[B") {
      selectedEditorRowIndex = Math.min(selectedEditorRowIndex + 1, Math.max(0, rowCount - 1));
      normalizeSelectedValueIndex();
      normalizeSelectedEnvironmentIndex();
      if (selectedEditorRowIndex > editorScrollOffset + 9) {
        editorScrollOffset = selectedEditorRowIndex - 9;
      }
      renderCurrentScreen();
      return true;
    }

    if (sequence === "k" || sequence === "\u001b[A") {
      selectedEditorRowIndex = Math.max(0, selectedEditorRowIndex - 1);
      normalizeSelectedValueIndex();
      normalizeSelectedEnvironmentIndex();
      if (selectedEditorRowIndex < editorScrollOffset) {
        editorScrollOffset = selectedEditorRowIndex;
      }
      renderCurrentScreen();
      return true;
    }

    if (sequence === "e" || sequence === "E") {
      const selectedRow = rows[selectedEditorRowIndex];
      if (!selectedRow) {
        return true;
      }

      keyEditBuffer = selectedRow.key;
      setStatusMessage(`Editing key ${selectedRow.key}. Enter to save, Esc to cancel.`);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "h" || sequence === "\u001b[D") {
      selectedEditorValueIndex = Math.max(0, selectedEditorValueIndex - 1);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "[") {
      selectedEditorEnvironmentIndex = Math.max(0, selectedEditorEnvironmentIndex - 1);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "]") {
      const max = Math.max(0, environments.length - 1);
      selectedEditorEnvironmentIndex = Math.min(max, selectedEditorEnvironmentIndex + 1);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "l" || sequence === "\u001b[C") {
      const selectedRow = rows[selectedEditorRowIndex];
      const max = Math.max(0, (selectedRow?.values.length ?? 1) - 1);
      selectedEditorValueIndex = Math.min(max, selectedEditorValueIndex + 1);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "a" || sequence === "A") {
      const selectedRow = rows[selectedEditorRowIndex];
      if (!draft || !selectedRow) {
        return true;
      }

      const nextDraft = addValueToDraft(draft, selectedRow.rowId);
      if (!nextDraft.addedValueId) {
        return true;
      }

      const addedIndex = nextDraft.draft.rows[selectedEditorRowIndex]?.values.findIndex(
        (value) => value.id === nextDraft.addedValueId,
      );
      selectedEditorValueIndex = addedIndex === undefined || addedIndex < 0 ? selectedEditorValueIndex : addedIndex;

      patchEditorDraft(nextDraft.draft);

      setStatusMessage(`Added value V${selectedEditorValueIndex + 1}. Press v to edit.`);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "v" || sequence === "V") {
      const selectedRow = rows[selectedEditorRowIndex];
      const selectedValue = selectedRow?.values[Math.max(0, selectedEditorValueIndex)];
      if (!selectedValue) {
        setStatusMessage("No value selected. Press a to add one.");
        renderCurrentScreen();
        return true;
      }

      valueEditBuffer = selectedValue.content;
      setStatusMessage(`Editing value V${selectedEditorValueIndex + 1}. Enter to save, Esc to cancel.`);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "x" || sequence === "X") {
      const selectedRow = rows[selectedEditorRowIndex];
      const selectedValue = selectedRow?.values[Math.max(0, selectedEditorValueIndex)];
      if (!draft || !selectedRow || !selectedValue) {
        return true;
      }

      const result = removeValueFromDraft(draft, selectedRow.rowId, selectedValue.id);
      if (!result.removed) {
        if (result.reason === "assigned") {
          setStatusMessage("Cannot delete value while environments are assigned to it.");
        } else {
          setStatusMessage("Value no longer exists.");
        }
        renderCurrentScreen();
        return true;
      }

      selectedEditorValueIndex = Math.max(0, selectedEditorValueIndex - 1);

      patchEditorDraft(result.draft);

      normalizeSelectedValueIndex();
      setStatusMessage(`Deleted value V${selectedEditorValueIndex + 1}.`);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "s" || sequence === "S") {
      const selectedRow = rows[selectedEditorRowIndex];
      const selectedValue = selectedRow?.values[Math.max(0, selectedEditorValueIndex)];
      const selectedEnvironment = environments[Math.max(0, selectedEditorEnvironmentIndex)];

      if (!draft || !selectedRow || !selectedEnvironment) {
        return true;
      }

      if (!selectedValue) {
        setStatusMessage("No value selected. Press a to add one.");
        renderCurrentScreen();
        return true;
      }

      const permission = canEditAssignment(draft, selectedRow, selectedEnvironment.id);
      if (!permission.allowed && permission.reason) {
        setStatusMessage(assignmentBlockReasonMessage(permission.reason));
        renderCurrentScreen();
        return true;
      }

      const nextDraft = setRowAssignment(draft, selectedRow.rowId, selectedEnvironment.id, selectedValue.id);
      if (!nextDraft.updated) {
        setStatusMessage(`Assignment for ${selectedEnvironment.name} already set to this value.`);
        renderCurrentScreen();
        return true;
      }

      patchEditorDraft(nextDraft.draft);

      setStatusMessage(`Set ${selectedEnvironment.name} to V${selectedEditorValueIndex + 1}.`);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "u" || sequence === "U") {
      const selectedRow = rows[selectedEditorRowIndex];
      const selectedEnvironment = environments[Math.max(0, selectedEditorEnvironmentIndex)];

      if (!draft || !selectedRow || !selectedEnvironment) {
        return true;
      }

      const permission = canEditAssignment(draft, selectedRow, selectedEnvironment.id);
      if (!permission.allowed && permission.reason) {
        setStatusMessage(assignmentBlockReasonMessage(permission.reason));
        renderCurrentScreen();
        return true;
      }

      const nextDraft = setRowAssignment(draft, selectedRow.rowId, selectedEnvironment.id, null);
      if (!nextDraft.updated) {
        setStatusMessage(`${selectedEnvironment.name} is already unset.`);
        renderCurrentScreen();
        return true;
      }

      patchEditorDraft(nextDraft.draft);

      setStatusMessage(`Unset ${selectedEnvironment.name} assignment.`);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "z" || sequence === "Z") {
      const selectedRow = rows[selectedEditorRowIndex];
      if (!draft || !state.editor.baseline || !selectedRow) {
        return true;
      }

      const result = undoRowDraftChange(state.editor.baseline, draft, selectedRow.rowId);
      if (!result.changed) {
        setStatusMessage(`No pending edits for ${selectedRow.key}.`);
        renderCurrentScreen();
        return true;
      }

      patchEditorDraft(result.draft);
      selectedEditorRowIndex = Math.min(selectedEditorRowIndex, Math.max(0, result.draft.rows.length - 1));
      normalizeSelectedValueIndex();
      normalizeSelectedEnvironmentIndex();
      setStatusMessage(`Undid edits for ${selectedRow.key}.`);
      renderCurrentScreen();
      return true;
    }

    if (sequence === "p" || sequence === "P") {
      if (state.editor.pendingOperations.length === 0) {
        setStatusMessage("No pending operations to apply.");
        renderCurrentScreen();
        return true;
      }

      confirmInput = "";
      store.transitionTo("confirm");
      setStatusMessage("Type confirmation phrase exactly to continue.");
      renderCurrentScreen();
      return true;
    }

    return false;
  });

  renderer.addInputHandler((sequence) => {
    const state = store.getState();
    if (state.screen !== "confirm") {
      return false;
    }

    if (sequence === "\u001b") {
      confirmInput = "";
      store.transitionTo("editor");
      setStatusMessage("Apply cancelled.");
      renderCurrentScreen();
      return true;
    }

    if (sequence === "\r" || sequence === "\n") {
      if (!isApplyConfirmPhraseValid(confirmInput)) {
        setStatusMessage("Confirmation phrase mismatch. Apply is blocked.");
        renderCurrentScreen();
        return true;
      }

      confirmInput = "";
      void runApplyPipeline();
      return true;
    }

    if (sequence === "\u007f") {
      confirmInput = confirmInput.slice(0, -1);
      renderCurrentScreen();
      return true;
    }

    if (/^[\x20-\x7E]$/.test(sequence)) {
      confirmInput += sequence;
      renderCurrentScreen();
      return true;
    }

    return true;
  });

  renderer.addInputHandler((sequence) => {
    const state = store.getState();
    if (state.screen !== "report") {
      return false;
    }

    if (sequence === "\r" || sequence === "\n" || sequence === "\u001b") {
      store.transitionTo("editor");
      setStatusMessage("Returned to editor.");
      renderCurrentScreen();
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
        process.stderr.write("Keys: q quit, r refresh auth, tab scope, j/k project, enter continue, h/l value, [/ ] env, a add, v edit, x delete, s set, u unset, z undo row, p apply\n");
      },
      onRefresh: () => {
        void refreshAuthStatus();
      },
      isTextInputMode: () => keyEditBuffer !== null || valueEditBuffer !== null || store.getState().screen === "confirm",
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
