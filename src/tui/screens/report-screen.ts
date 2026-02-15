import { Box, Text } from "@opentui/core";

import type { ApplyResultData } from "@/lib/types";

import { formatApplyReportLines } from "./report-format";

export interface ReportScreenModel {
  report: ApplyResultData | null;
  statusMessage: string;
  keyHints: string;
}

export function ReportScreen(model: ReportScreenModel) {
  const lines = formatApplyReportLines(model.report);

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
    Text({ content: lines.join("\n") }),
    Text({ content: `Status: ${model.statusMessage}` }),
    Text({ content: model.keyHints }),
  );
}
