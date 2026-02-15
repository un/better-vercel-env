import type { TuiScreen } from "../state";

interface KeyHintInput {
  screen: TuiScreen;
  textInputMode?: boolean;
}

export function getContextKeyHints(input: KeyHintInput): string {
  if (input.screen === "auth") {
    return "Hints: r refresh auth, q quit, ? help";
  }

  if (input.screen === "picker") {
    return "Hints: tab scope, j/k project, enter open editor, q quit";
  }

  if (input.screen === "confirm") {
    return "Hints: type phrase, Enter apply, Esc cancel, q quit";
  }

  if (input.screen === "report") {
    return "Hints: Enter return editor, q quit";
  }

  if (input.textInputMode) {
    return "Hints: Enter save, Esc cancel, Backspace delete";
  }

  return "Hints: j/k row, h/l value, [/ ] env, p apply, z undo, q quit";
}
