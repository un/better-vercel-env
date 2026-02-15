import type { TuiAppState } from "./types";
import type { TuiScreen } from "./types";

import { transitionScreen } from "./machine";

type Listener = (state: TuiAppState) => void;

function createInitialState(): TuiAppState {
  return {
    screen: "auth",
    scopes: [],
    projects: [],
    selection: {
      scopeId: null,
      projectId: null,
    },
    editor: {
      snapshot: null,
      baseline: null,
      draft: null,
      pendingOperations: [],
      failedOperationIds: [],
    },
    applyReport: null,
    status: {
      loading: false,
      message: null,
      error: null,
    },
  };
}

export class TuiStore {
  private state: TuiAppState;
  private listeners = new Set<Listener>();

  constructor(initialState: TuiAppState = createInitialState()) {
    this.state = initialState;
  }

  getState(): TuiAppState {
    return this.state;
  }

  setState(nextState: TuiAppState): void {
    this.state = nextState;
    this.listeners.forEach((listener) => listener(this.state));
  }

  patchState(patch: Partial<TuiAppState>): void {
    this.setState({
      ...this.state,
      ...patch,
    });
  }

  transitionTo(nextScreen: TuiScreen): void {
    this.setState(transitionScreen(this.state, nextScreen));
  }

  reset(): void {
    this.setState(createInitialState());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function createTuiStore(): TuiStore {
  return new TuiStore();
}
