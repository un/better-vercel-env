import type { TuiAppState, TuiScreen } from "./types";

const allowedTransitions: Record<TuiScreen, TuiScreen[]> = {
  auth: ["picker"],
  picker: ["auth", "editor"],
  editor: ["picker", "confirm", "report"],
  confirm: ["editor", "report"],
  report: ["editor", "picker"],
};

export function canTransitionScreen(from: TuiScreen, to: TuiScreen): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionScreen(state: TuiAppState, nextScreen: TuiScreen): TuiAppState {
  if (state.screen === nextScreen) {
    return state;
  }

  if (!canTransitionScreen(state.screen, nextScreen)) {
    throw new Error(`Invalid screen transition: ${state.screen} -> ${nextScreen}`);
  }

  return {
    ...state,
    screen: nextScreen,
  };
}
