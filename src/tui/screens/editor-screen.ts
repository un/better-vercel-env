import { Box, Text } from "@opentui/core";

import type { EnvMatrixDraft } from "@/lib/env-model";

export interface EditorScreenModel {
  baseline: EnvMatrixDraft | null;
  draft: EnvMatrixDraft | null;
  scrollOffset: number;
  selectedRowId: string | null;
  selectedValueId: string | null;
  selectedEnvironmentId: string | null;
  keyEditBuffer: string | null;
  valueEditBuffer: string | null;
  statusMessage: string;
}

function assignmentLabel(valueId: string | null, row: EnvMatrixDraft["rows"][number]): string {
  if (!valueId) {
    return "Unset";
  }

  const index = row.values.findIndex((value) => value.id === valueId);
  if (index < 0) {
    return "Unset";
  }

  return `V${index + 1}`;
}

function valuePoolFingerprint(row: EnvMatrixDraft["rows"][number]): string {
  return JSON.stringify(
    row.values.map((value) => ({
      id: value.id,
      content: value.content,
      type: value.type,
      gitBranch: value.gitBranch,
    })),
  );
}

function rowLine(
  row: EnvMatrixDraft["rows"][number],
  baselineRow: EnvMatrixDraft["rows"][number] | null,
  environments: EnvMatrixDraft["environments"],
  selectedRowId: string | null,
  selectedValueId: string | null,
  selectedEnvironmentId: string | null,
): string {
  const values = row.values
    .map((value, index) => {
      const marker = value.id === selectedValueId && row.rowId === selectedRowId ? "*" : "";
      return `V${index + 1}${marker}:${value.content}`;
    })
    .join(" | ");
  const keyChanged = !baselineRow || baselineRow.key !== row.key;
  const valuesChanged = !baselineRow || valuePoolFingerprint(baselineRow) !== valuePoolFingerprint(row);
  const assignments = environments
    .map((environment) => {
      const selected = environment.id === selectedEnvironmentId && row.rowId === selectedRowId ? "*" : "";
      const changed = !baselineRow || baselineRow.assignments[environment.id] !== row.assignments[environment.id];
      const label = assignmentLabel(row.assignments[environment.id], row);
      return `${selected}${changed ? "!" : ""}${environment.name}:${label}`;
    })
    .join(" ");

  const marker = row.rowId === selectedRowId ? ">" : keyChanged || valuesChanged ? "!" : " ";
  return `${marker} ${keyChanged ? `!${row.key}` : row.key} | ${valuesChanged ? `!${values || "-"}` : values || "-"} | ${assignments}`;
}

export function EditorScreen(model: EditorScreenModel) {
  const rows = model.draft?.rows ?? [];
  const environments = model.draft?.environments ?? [];
  const baselineRowsById = new Map((model.baseline?.rows ?? []).map((row) => [row.rowId, row]));
  const pageSize = 10;
  const safeOffset = Math.max(0, Math.min(model.scrollOffset, Math.max(0, rows.length - pageSize)));
  const visibleRows = rows.slice(safeOffset, safeOffset + pageSize);

  return Box(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      padding: 1,
      gap: 1,
      borderStyle: "rounded",
    },
    Text({ content: "Matrix Editor" }),
    Text({ content: `Key | Values | ${environments.map((environment) => environment.name).join(" | ") || "Assignments"}` }),
    Text({
      content:
        visibleRows.length > 0
          ? visibleRows
              .map((row) =>
                rowLine(
                  row,
                  baselineRowsById.get(row.rowId) ?? null,
                  environments,
                  model.selectedRowId,
                  model.selectedValueId,
                  model.selectedEnvironmentId,
                ),
              )
              .join("\n")
          : "No rows",
    }),
    Text({ content: `Rows ${safeOffset + 1}-${Math.min(safeOffset + pageSize, rows.length)} of ${rows.length}` }),
    Text({ content: "Legend: ! changed, * active selection" }),
    Text({ content: `Status: ${model.statusMessage}` }),
    Text({
      content:
        model.keyEditBuffer !== null
          ? `Editing key: ${model.keyEditBuffer}`
          : model.valueEditBuffer !== null
            ? `Editing value: ${model.valueEditBuffer}`
            : "Keys: j/k row, h/l value, [/ ] env, e key, a add value, v edit value, x delete value, s set, u unset, q quit",
    }),
  );
}
