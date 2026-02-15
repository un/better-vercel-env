import { describe, expect, it } from "vitest";

import type { EnvOperation } from "@/lib/env-model";

import { buildCliApplyActions } from "./apply-builder";
import { parseVercelEnvListOutput } from "./env-list";
import { normalizeProjects } from "./projects";
import { parseVercelTeamsListOutput } from "./teams";

describe("CLI command builders and parsers", () => {
  it("builds deterministic apply actions and skips unsupported operations", () => {
    const operations: EnvOperation[] = [
      {
        id: "update-row:1",
        kind: "update_env",
        summary: "update",
        rowId: "row:1",
        before: null,
        after: {
          rowId: "row:1",
          key: "ALPHA",
          value: "value-a",
          target: ["preview", "production"],
          customEnvironmentIds: [],
        },
        undoToken: "undo:1",
      },
      {
        id: "create-row:2",
        kind: "create_env",
        summary: "create",
        rowId: "row:2",
        before: null,
        after: {
          rowId: "row:2",
          key: "BETA",
          value: "value-b",
          target: ["development"],
          customEnvironmentIds: ["ce_1"],
        },
        undoToken: "undo:2",
      },
      {
        id: "create-row:3",
        kind: "create_env",
        summary: "create reserved",
        rowId: "row:3",
        before: null,
        after: {
          rowId: "row:3",
          key: "NX_DAEMON",
          value: "1",
          target: ["preview"],
          customEnvironmentIds: [],
        },
        undoToken: "undo:3",
      },
    ];

    const actions = buildCliApplyActions(operations);
    expect(actions).toEqual([
      {
        operationId: "update-row:1",
        actionKind: "add",
        key: "ALPHA",
        environment: "preview",
        value: "value-a",
        reason: null,
      },
      {
        operationId: "update-row:1",
        actionKind: "add",
        key: "ALPHA",
        environment: "production",
        value: "value-a",
        reason: null,
      },
      {
        operationId: "create-row:2",
        actionKind: "skip",
        key: "BETA",
        environment: null,
        value: null,
        reason: "unsupported_custom_environment",
      },
      {
        operationId: "create-row:3",
        actionKind: "skip",
        key: "NX_DAEMON",
        environment: null,
        value: null,
        reason: "reserved_runtime_key",
      },
    ]);
  });

  it("parses teams list output and detects current team", () => {
    const output = [
      "Vercel CLI 48.0.0",
      "Fetching teams",
      "id           name           slug",
      "> team_a123   Alpha Team     alpha-team (current)",
      "  team_b999   Beta Team      beta-team",
    ].join("\n");

    const teams = parseVercelTeamsListOutput(output);
    expect(teams).toEqual([
      { id: "team_a123", name: "Alpha Team", slug: "alpha-team", isCurrent: true },
      { id: "team_b999", name: "Beta Team", slug: "beta-team", isCurrent: false },
    ]);
  });

  it("handles malformed project rows and keeps valid entries", () => {
    const projects = normalizeProjects(
      [
        { id: "prj_1", name: "Alpha", framework: "nextjs", updatedAt: 100 },
        { id: "prj_2", name: "Beta", updatedAt: 200 },
        { id: "missing_name" },
      ],
      "",
    );

    expect(projects).toEqual([
      { id: "prj_2", name: "Beta", framework: null, updatedAt: 200 },
      { id: "prj_1", name: "Alpha", framework: "nextjs", updatedAt: 100 },
    ]);
  });

  it("parses env ls topology rows", () => {
    const output = [
      "Vercel CLI 44.6.4",
      "Retrieving project...",
      "name      value               environments                created",
      "IN_ALL    Encrypted           Development                 15m ago",
      "IN_ALL    Encrypted           Preview, Production         3h ago",
      "IN_DEV    Encrypted           Preview                     2h ago",
    ].join("\n");

    expect(parseVercelEnvListOutput(output)).toEqual([
      { key: "IN_ALL", target: ["development"] },
      { key: "IN_ALL", target: ["production", "preview"] },
      { key: "IN_DEV", target: ["preview"] },
    ]);
  });
});
