import { describe, expect, it, vi } from "vitest";

import { handleGlobalKeySequence } from "./global-keys";

function createHandlers(inputMode = false) {
  return {
    onQuit: vi.fn(),
    onHelp: vi.fn(),
    onRefresh: vi.fn(),
    isTextInputMode: () => inputMode,
  };
}

describe("handleGlobalKeySequence", () => {
  it("handles quit, help, and refresh sequences", () => {
    const handlers = createHandlers();

    expect(handleGlobalKeySequence("q", handlers)).toBe(true);
    expect(handleGlobalKeySequence("?", handlers)).toBe(true);
    expect(handleGlobalKeySequence("r", handlers)).toBe(true);

    expect(handlers.onQuit).toHaveBeenCalledTimes(1);
    expect(handlers.onHelp).toHaveBeenCalledTimes(1);
    expect(handlers.onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not hijack regular input in text mode", () => {
    const handlers = createHandlers(true);

    expect(handleGlobalKeySequence("h", handlers)).toBe(false);
    expect(handleGlobalKeySequence("r", handlers)).toBe(false);
    expect(handlers.onHelp).not.toHaveBeenCalled();
    expect(handlers.onRefresh).not.toHaveBeenCalled();
  });
});
