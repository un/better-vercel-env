const ENV_ASSIGNMENT_PATTERN = /(^|\n)([A-Za-z_][A-Za-z0-9_]*)=([^\n]*)/g;
const TOKEN_ARG_PATTERN = /(--token\s+)([^\s]+)/g;
const BEARER_PATTERN = /(Bearer\s+)([^\s]+)/gi;
const SECRET_KEY_PATTERN = /(TOKEN|SECRET|PASSWORD|PRIVATE|API_KEY|ACCESS_KEY|AUTH|KEY)/i;

function redactEnvAssignments(input: string): string {
  return input.replace(ENV_ASSIGNMENT_PATTERN, (match, linePrefix: string, key: string) => {
    if (!SECRET_KEY_PATTERN.test(key)) {
      return match;
    }

    return `${linePrefix}${key}=[REDACTED]`;
  });
}

export function redactSensitiveText(input: string): string {
  return redactEnvAssignments(input)
    .replace(TOKEN_ARG_PATTERN, "$1[REDACTED]")
    .replace(BEARER_PATTERN, "$1[REDACTED]");
}
