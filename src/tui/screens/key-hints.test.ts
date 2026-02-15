import { describe, expect, it } from "vitest";

import { getContextKeyHints } from "./key-hints";

describe("getContextKeyHints", () => {
  it("returns screen-specific hints", () => {
    expect(getContextKeyHints({ screen: "auth" })).toContain("refresh auth");
    expect(getContextKeyHints({ screen: "picker" })).toContain("tab scope");
    expect(getContextKeyHints({ screen: "confirm" })).toContain("type phrase");
    expect(getContextKeyHints({ screen: "report" })).toContain("return editor");
  });

  it("returns editor text-input hints when typing", () => {
    expect(getContextKeyHints({ screen: "editor", textInputMode: true })).toContain("Enter save");
  });
});
