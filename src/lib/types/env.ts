export type BuiltInEnvironmentId = "production" | "preview" | "development";

export type EnvironmentId = BuiltInEnvironmentId | `custom:${string}`;

export interface EnvironmentColumn {
  id: EnvironmentId;
  name: string;
  kind: "built_in" | "custom";
  customEnvironmentId: string | null;
}

export interface RawVercelEnvRecord {
  id: string;
  key: string;
  value: string;
  type: "plain" | "encrypted";
  target: BuiltInEnvironmentId[];
  customEnvironmentIds: string[];
  comment: string | null;
  gitBranch: string | null;
  system: boolean;
}

export interface ProjectEnvSnapshot {
  projectId: string;
  environments: EnvironmentColumn[];
  records: RawVercelEnvRecord[];
  baselineHash: string;
}
