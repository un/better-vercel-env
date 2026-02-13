#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

const net = require("node:net");
const { spawn } = require("node:child_process");

const host = process.env.HOST || "127.0.0.1";
const requestedPort = Number.parseInt(process.env.PORT || "6969", 10);
const tokenUrl = "https://vercel.com/account/settings/tokens";

if (Number.isNaN(requestedPort) || requestedPort <= 0) {
  console.error("Invalid PORT value. Use a positive integer.");
  process.exit(1);
}

function isPortAvailable(hostname, port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, hostname);
  });
}

async function resolvePort(hostname, preferredPort) {
  const maxAttempts = 20;

  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidatePort = preferredPort + offset;
    const available = await isPortAvailable(hostname, candidatePort);

    if (available) {
      return candidatePort;
    }
  }

  return null;
}

async function main() {
  const resolvedPort = await resolvePort(host, requestedPort);

  if (!resolvedPort) {
    console.error(
      `No available port found in range ${requestedPort}-${requestedPort + 19}. Set PORT manually and retry.`,
    );
    process.exit(1);
  }

  if (resolvedPort !== requestedPort) {
    console.warn(
      `Port ${requestedPort} is occupied. Starting Vercel Better Env on fallback port ${resolvedPort}.`,
    );
  }

  const appUrl = `http://${host}:${resolvedPort}`;
  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", host, "--port", String(resolvedPort)],
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
}

main();
