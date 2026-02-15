import { Box, Text, createCliRenderer } from "@opentui/core";
import { pathToFileURL } from "node:url";

import { registerRendererLifecycle } from "./lifecycle";

async function startTuiApp(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  });
  const lifecycle = registerRendererLifecycle(renderer);

  renderer.root.add(
    Box(
      {
        borderStyle: "rounded",
        padding: 1,
        flexDirection: "column",
      },
      Text({ content: "Better Vercel Env" }),
      Text({ content: "OpenTUI runtime is initialized." }),
    ),
  );

  if (process.env.VBE_TUI_SMOKE === "1") {
    lifecycle.shutdown("smoke");
    lifecycle.dispose();
  }
}

const isEntrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false;

if (isEntrypoint) {
  startTuiApp().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown startup error.";
    process.stderr.write(`Failed to start OpenTUI runtime: ${message}\n`);
    process.exit(1);
  });
}

export { startTuiApp };
