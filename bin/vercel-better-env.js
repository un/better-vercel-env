#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

const { spawn } = require("node:child_process");

const host = process.env.HOST || "127.0.0.1";
const port = Number.parseInt(process.env.PORT || "6969", 10);
const appUrl = `http://${host}:${port}`;
const tokenUrl = "https://vercel.com/account/settings/tokens";

if (Number.isNaN(port) || port <= 0) {
  console.error("Invalid PORT value. Use a positive integer.");
  process.exit(1);
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(
  process.execPath,
  [nextBin, "dev", "--hostname", host, "--port", String(port)],
  {
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  },
);

let startupBannerPrinted = false;

const maybePrintStartupBanner = (chunk) => {
  if (startupBannerPrinted) {
    return;
  }

  if (chunk.includes("Ready in")) {
    startupBannerPrinted = true;
    console.log(`\nVercel Better Env is running at: ${appUrl}`);
    console.log(`Generate a Vercel token at: ${tokenUrl}\n`);
  }
};

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  maybePrintStartupBanner(text);
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  process.stderr.write(text);
  maybePrintStartupBanner(text);
});

child.on("error", (error) => {
  console.error("Failed to start Next.js:", error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
