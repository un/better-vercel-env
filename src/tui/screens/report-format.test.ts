import { describe, expect, it } from "vitest";

import { formatApplyReportLines } from "./report-format";

describe("formatApplyReportLines", () => {
  it("returns empty message when report is missing", () => {
    expect(formatApplyReportLines(null)).toEqual(["No apply report available yet."]);
  });

  it("groups done, failed, and skipped entries", () => {
    const lines = formatApplyReportLines({
      accepted: 3,
      results: [
        { operationId: "op-1", status: "done", createdId: null, message: null },
        { operationId: "op-2", status: "failed", createdId: null, message: "permission_denied" },
        { operationId: "op-3", status: "skipped", createdId: null, message: "reserved_runtime_key" },
      ],
    });

    expect(lines).toContain("Done: 1");
    expect(lines).toContain("Failed: 1");
    expect(lines).toContain("Skipped: 1");
    expect(lines).toContain("- op-2: permission_denied");
    expect(lines).toContain("- op-3: reserved_runtime_key");
  });
});
