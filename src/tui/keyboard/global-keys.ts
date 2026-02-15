interface GlobalKeyBindingOptions {
  onQuit: () => void;
  onHelp: () => void;
  onRefresh: () => void;
  isTextInputMode: () => boolean;
}

export function handleGlobalKeySequence(sequence: string, options: GlobalKeyBindingOptions): boolean {
  if (sequence === "\u0003") {
    options.onQuit();
    return true;
  }

  if (options.isTextInputMode()) {
    return false;
  }

  if (sequence === "q" || sequence === "Q") {
    options.onQuit();
    return true;
  }

  if (sequence === "?" || sequence === "h" || sequence === "H") {
    options.onHelp();
    return true;
  }

  if (sequence === "r" || sequence === "R") {
    options.onRefresh();
    return true;
  }

  return false;
}
