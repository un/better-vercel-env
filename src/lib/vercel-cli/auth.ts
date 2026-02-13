import {
  VercelCliError,
  defaultVercelCliRunner,
  type VercelCliCommandRunner,
} from "./index";

export interface VercelCliIdentity {
  username: string;
  activeScope: string | null;
}

export interface VercelCliAuthStatus {
  authenticated: boolean;
  identity: VercelCliIdentity | null;
  message: string;
}

function parseWhoamiOutput(stdout: string): VercelCliIdentity | null {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const usernameLine = lines.find((line) => !line.startsWith("Vercel CLI") && !line.startsWith("Retrieving"));
  if (!usernameLine) {
    return null;
  }

  const scopeMatch = lines.join("\n").match(/scope:\s*([^\s]+)/i);

  return {
    username: usernameLine,
    activeScope: scopeMatch ? scopeMatch[1] : null,
  };
}

export async function getVercelCliAuthStatus(
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<VercelCliAuthStatus> {
  try {
    const result = await runner.run({
      executable: "vercel",
      args: ["whoami", "--no-color"],
      timeoutMs: 10_000,
    });

    const identity = parseWhoamiOutput(result.stdout);
    if (!identity) {
      return {
        authenticated: false,
        identity: null,
        message: "Unable to determine CLI login status. Run `vercel whoami` locally.",
      };
    }

    return {
      authenticated: true,
      identity,
      message: "CLI session is active.",
    };
  } catch (error) {
    if (error instanceof VercelCliError) {
      if (error.details.code === "cli_non_zero_exit") {
        return {
          authenticated: false,
          identity: null,
          message: "Not logged in. Run `vercel login` and refresh.",
        };
      }

      if (error.details.code === "cli_not_found") {
        return {
          authenticated: false,
          identity: null,
          message: "Vercel CLI is not installed. Install it, then run `vercel login`.",
        };
      }
    }

    return {
      authenticated: false,
      identity: null,
      message: "Unable to read CLI auth status right now. Retry after running `vercel whoami`.",
    };
  }
}
