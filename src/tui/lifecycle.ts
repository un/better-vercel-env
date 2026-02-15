type ShutdownSignal = NodeJS.Signals;

const DEFAULT_SIGNALS: ShutdownSignal[] = ["SIGINT", "SIGTERM"];

export interface Destroyable {
  destroy: () => void;
}

export interface LifecycleController {
  dispose: () => void;
  shutdown: (reason: string) => void;
}

export function registerRendererLifecycle(
  renderer: Destroyable,
  signals: ShutdownSignal[] = DEFAULT_SIGNALS,
): LifecycleController {
  let finalized = false;

  const shutdown = (reason: string) => {
    if (finalized) {
      return;
    }

    finalized = true;
    process.stderr.write(`Shutting down renderer (${reason})\n`);
    renderer.destroy();
  };

  const handlers = new Map<ShutdownSignal, () => void>();

  signals.forEach((signal) => {
    const handler = () => {
      shutdown(signal);
      process.exit(0);
    };

    handlers.set(signal, handler);
    process.on(signal, handler);
  });

  return {
    shutdown,
    dispose: () => {
      handlers.forEach((handler, signal) => {
        process.off(signal, handler);
      });
      handlers.clear();
    },
  };
}
