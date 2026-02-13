import {
  VercelCliError,
  defaultVercelCliRunner,
  type VercelCliCommandRunner,
} from "./index";

export interface VercelCliTeamScope {
  id: string;
  slug: string;
  name: string;
  isCurrent: boolean;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseVercelTeamsListOutput(output: string): VercelCliTeamScope[] {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.replace(/\u001b\[[0-9;]*m/g, "").trimEnd())
    .filter((line) => line.trim().length > 0);

  const teams: VercelCliTeamScope[] = [];

  for (const rawLine of lines) {
    if (/^vercel cli/i.test(rawLine) || /^fetching/i.test(rawLine) || /^id\s+/i.test(rawLine)) {
      continue;
    }

    const isCurrent = /^>\s*/.test(rawLine) || /\(current\)/i.test(rawLine);
    const normalized = rawLine.replace(/^>\s*/, "").replace(/\(current\)/gi, "").trim();
    const idMatch = normalized.match(/\bteam_[a-zA-Z0-9]+\b/);

    if (!idMatch) {
      continue;
    }

    const id = idMatch[0];
    const columns = normalized.split(/\s{2,}/).map((column) => column.trim()).filter(Boolean);

    let name = "";
    let slug = "";

    if (columns[0] === id) {
      name = columns[1] ?? id;
      slug = columns[2] ?? toSlug(name);
    } else {
      const idIndex = columns.findIndex((column) => column.includes(id));
      name = columns[idIndex + 1] ?? columns[0] ?? id;
      slug = columns[idIndex + 2] ?? toSlug(name);
    }

    teams.push({
      id,
      name,
      slug: slug || toSlug(name),
      isCurrent,
    });
  }

  return teams;
}

export async function listVercelTeamScopes(
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<VercelCliTeamScope[]> {
  try {
    const result = await runner.run({
      executable: "vercel",
      args: ["teams", "list", "--no-color"],
      timeoutMs: 15_000,
    });

    return parseVercelTeamsListOutput(result.stdout);
  } catch (error) {
    if (error instanceof VercelCliError && error.details.code === "cli_non_zero_exit") {
      if (/no teams found/i.test(error.details.stderr) || /no teams found/i.test(error.details.stdout)) {
        return [];
      }
    }

    throw error;
  }
}
