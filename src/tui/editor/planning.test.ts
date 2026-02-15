import { describe, expect, it } from "vitest";

import { normalizeSnapshotToDraft } from "../../lib/env-model/normalize";
import type { ProjectEnvSnapshot } from "../../lib/types";

import { computePendingOperations } from "./planning";

const snapshot: ProjectEnvSnapshot = {
  projectId: "prj_1",
  baselineHash: "hash",
  capabilities: {
    supportsCustomEnvironments: true,
    supportsBranchSpecificWrites: true,
  },
  environments: [
    { id: "production", name: "Production", kind: "built_in", customEnvironmentId: null },
    { id: "preview", name: "Preview", kind: "built_in", customEnvironmentId: null },
    { id: "development", name: "Development", kind: "built_in", customEnvironmentId: null },
  ],
  records: [
    {
      id: "env_1",
      key: "API_KEY",
      value: "alpha",
      type: "plain",
      target: ["production"],
      customEnvironmentIds: [],
      comment: null,
      gitBranch: null,
      system: false,
      readOnlyReason: null,
    },
  ],
};

describe("computePendingOperations", () => {
  it("returns no operations for unchanged draft", () => {
    const baseline = normalizeSnapshotToDraft(snapshot);
    const draft = structuredClone(baseline);

    expect(computePendingOperations(baseline, draft)).toHaveLength(0);
  });

  it("returns deterministic operations for edited draft", () => {
    const baseline = normalizeSnapshotToDraft(snapshot);
    const draft = structuredClone(baseline);
    draft.rows[0]!.values[0]!.content = "beta";

    const first = computePendingOperations(baseline, draft);
    const second = computePendingOperations(baseline, draft);

    expect(first.length).toBeGreaterThan(0);
    expect(first.map((operation) => operation.id)).toEqual(second.map((operation) => operation.id));
  });
});
