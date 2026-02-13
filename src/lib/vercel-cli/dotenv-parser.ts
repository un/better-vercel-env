import { promises as fs } from "node:fs";

import { parse } from "dotenv";

export type ParsedDotenvMap = Record<string, string>;

export function parseDotenvContent(content: string): ParsedDotenvMap {
  return parse(content);
}

export async function parseDotenvFile(filePath: string): Promise<ParsedDotenvMap> {
  const content = await fs.readFile(filePath, "utf8");
  return parseDotenvContent(content);
}
