import { Box, Text } from "@opentui/core";

import type { ApplyResultData } from "@/lib/types";

export interface ReportScreenModel {
  report: ApplyResultData | null;
  statusMessage: string;
}

export function ReportScreen(model: ReportScreenModel) {
  const accepted = model.report?.accepted ?? 0;
  const results = model.report?.results ?? [];

  return Box(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      padding: 1,
      gap: 1,
      borderStyle: "rounded",
    },
    Text({ content: "Apply Report" }),
    Text({ content: `Accepted operations: ${accepted}` }),
    Text({ content: `Result entries: ${results.length}` }),
    Text({ content: `Status: ${model.statusMessage}` }),
    Text({ content: "Keys: Enter return to editor, q quit" }),
  );
}
