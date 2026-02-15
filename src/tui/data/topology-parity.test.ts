import { describe, expect, it } from "vitest";

import { normalizeSnapshotToDraft } from "../../lib/env-model/normalize";
import { planOperations } from "../../lib/env-model/planner";
import type { ProjectEnvSnapshot } from "../../lib/types";

const splitTopologySnapshot: ProjectEnvSnapshot = {
  projectId: "prj_1",
  baselineHash: "hash",
  capabilities: {
    supportsCustomEnvironments: false,
    supportsBranchSpecificWrites: false,
  },
  environments: [
    { id: "production", name: "Production", kind: "built_in", customEnvironmentId: null },
    { id: "preview", name: "Preview", kind: "built_in", customEnvironmentId: null },
    { id: "development", name: "Development", kind: "built_in", customEnvironmentId: null },
  ],
  records: [
    {
      id: "env_prod",
      key: "IN_ALL",
      value: "shared",
      type: "plain",
      target: ["production"],
      customEnvironmentIds: [],
      comment: null,
      gitBranch: null,
      system: false,
      readOnlyReason: null,
    },
    {
      id: "env_non_prod",
      key: "IN_ALL",
      value: "shared",
      type: "plain",
      target: ["preview", "development"],
      customEnvironmentIds: [],
      comment: null,
      gitBranch: null,
      system: false,
      readOnlyReason: null,
    },
  ],
};

describe("topology parity through TUI normalization", () => {
  it("keeps split topology source rows without collapsing planner context", () => {
    const baseline = normalizeSnapshotToDraft(splitTopologySnapshot);
    const row = baseline.rows.find((item) => item.key === "IN_ALL");

    expect(row).toBeTruthy();
    expect(row?.sourceRows).toHaveLength(2);
    expect(row?.assignments.production).toBeTruthy();
    expect(row?.assignments.preview).toBeTruthy();
    expect(row?.assignments.development).toBeTruthy();

    const noOpPlan = planOperations(baseline, structuredClone(baseline));
    expect(noOpPlan.operations).toHaveLength(0);
  });
});
