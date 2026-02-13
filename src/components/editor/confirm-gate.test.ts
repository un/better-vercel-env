import { describe, expect, it } from "vitest";

import { APPLY_CONFIRM_PHRASE, isApplyConfirmPhraseValid } from "./confirm-gate";

describe("isApplyConfirmPhraseValid", () => {
  it("accepts only the exact confirmation phrase", () => {
    expect(isApplyConfirmPhraseValid(APPLY_CONFIRM_PHRASE)).toBe(true);
  });

  it("rejects case mismatches", () => {
    expect(isApplyConfirmPhraseValid("I confirm I am not an agent.")).toBe(false);
  });

  it("rejects spacing mismatches", () => {
    expect(isApplyConfirmPhraseValid("i  confirm I am not an agent.")).toBe(false);
    expect(isApplyConfirmPhraseValid("i confirm I am not an agent. ")).toBe(false);
  });
});
