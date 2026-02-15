#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("node:path");
const { spawn } = require("node:child_process");

const packageRoot = path.resolve(__dirname, "..");
const tuiEntrypoint = path.join(packageRoot, "src", "tui", "main.ts");

const child = spawn("bun", ["run", tuiEntrypoint], {
  cwd: packageRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  if (error && error.code === "ENOENT") {
    process.stderr.write("Bun is required to run vercel-better-env. Install Bun and retry.\n");
    process.exit(1);
    return;
  }

  process.stderr.write(`Failed to start OpenTUI runtime: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal === "SIGINT") {
    process.exit(130);
    return;
  }

  if (signal === "SIGTERM") {
    process.exit(143);
    return;
  }

  process.exit(code ?? 1);
});
