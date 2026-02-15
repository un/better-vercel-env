import type { ApplyResultData } from "@/lib/types";

function formatGroupLines(title: string, lines: string[]): string[] {
  if (lines.length === 0) {
    return [`${title}: 0`];
  }

  return [`${title}: ${lines.length}`, ...lines.map((line) => `- ${line}`)];
}

export function formatApplyReportLines(report: ApplyResultData | null): string[] {
  if (!report) {
    return ["No apply report available yet."];
  }

  const done = report.results
    .filter((item) => item.status === "done")
    .map((item) => `${item.operationId}${item.message ? ` (${item.message})` : ""}`);

  const failed = report.results
    .filter((item) => item.status === "failed")
    .map((item) => `${item.operationId}: ${item.message ?? "failed"}`);

  const skipped = report.results
    .filter((item) => item.status === "skipped")
    .map((item) => `${item.operationId}: ${item.message ?? "skipped"}`);

  return [
    `Accepted operations: ${report.accepted}`,
    ...formatGroupLines("Done", done),
    ...formatGroupLines("Failed", failed),
    ...formatGroupLines("Skipped", skipped),
  ];
}
