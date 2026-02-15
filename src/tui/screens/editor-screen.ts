import { Box, Text } from "@opentui/core";

import type { EnvMatrixDraft } from "@/lib/env-model";

export interface EditorScreenModel {
  draft: EnvMatrixDraft | null;
  scrollOffset: number;
  selectedRowId: string | null;
  keyEditBuffer: string | null;
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

function rowLine(row: EnvMatrixDraft["rows"][number], selectedRowId: string | null): string {
  const values = row.values.map((value, index) => `V${index + 1}:${value.content}`).join(" | ");
  const prod = assignmentLabel(row.assignments.production, row);
  const prev = assignmentLabel(row.assignments.preview, row);
  const dev = assignmentLabel(row.assignments.development, row);

  const marker = row.rowId === selectedRowId ? ">" : " ";
  return `${marker} ${row.key} | ${values || "-"} | P:${prod} Pr:${prev} D:${dev}`;
}

export function EditorScreen(model: EditorScreenModel) {
  const rows = model.draft?.rows ?? [];
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
    Text({ content: "Key | Values | Production | Preview | Development" }),
    Text({ content: visibleRows.length > 0 ? visibleRows.map((row) => rowLine(row, model.selectedRowId)).join("\n") : "No rows" }),
    Text({ content: `Rows ${safeOffset + 1}-${Math.min(safeOffset + pageSize, rows.length)} of ${rows.length}` }),
    Text({ content: `Status: ${model.statusMessage}` }),
    Text({ content: model.keyEditBuffer === null ? "Keys: j/k move, e edit key, q quit" : `Editing key: ${model.keyEditBuffer}` }),
  );
}
