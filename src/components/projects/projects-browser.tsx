"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { VercelProjectSummary, VercelScopeSummary } from "@/lib/types";

interface ScopesResponse {
  data?: {
    scopes?: VercelScopeSummary[];
  };
}

interface ProjectsResponse {
  data?: {
    projects?: VercelProjectSummary[];
  };
}

export function ProjectsBrowser() {
  const [scopes, setScopes] = useState<VercelScopeSummary[]>([]);
  const [activeScopeId, setActiveScopeId] = useState<string | null>(null);
  const [projects, setProjects] = useState<VercelProjectSummary[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadScopes = async () => {
      const response = await fetch("/api/vercel/scopes");
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as ScopesResponse;
      const fetchedScopes = payload.data?.scopes ?? [];
      setScopes(fetchedScopes);
      setActiveScopeId(fetchedScopes[0]?.id ?? null);
    };

    void loadScopes();
  }, []);

  useEffect(() => {
    if (!activeScopeId) {
      return;
    }

    const loadProjects = async () => {
      const params = new URLSearchParams({ scopeId: activeScopeId });
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/vercel/projects?${params.toString()}`);
      if (!response.ok) {
        setProjects([]);
        return;
      }

      const payload = (await response.json()) as ProjectsResponse;
      setProjects(payload.data?.projects ?? []);
    };

    void loadProjects();
  }, [activeScopeId, search]);

  const groupedScopes = useMemo(
    () => ({
      personal: scopes.filter((scope) => scope.type === "personal"),
      teams: scopes.filter((scope) => scope.type === "team"),
    }),
    [scopes],
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Scopes</h2>
        <div className="mt-3 space-y-3">
          {[...groupedScopes.personal, ...groupedScopes.teams].map((scope) => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setActiveScopeId(scope.id)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                activeScopeId === scope.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="font-medium">{scope.name}</div>
              <div className="text-xs text-muted-foreground">{scope.slug}</div>
            </button>
          ))}
        </div>
      </aside>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 space-y-2">
          <h2 className="text-lg font-medium">Projects</h2>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
          />
        </div>
        <div className="space-y-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/env`}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-accent"
            >
              <span className="font-medium">{project.name}</span>
              <span className="text-xs text-muted-foreground">{project.framework ?? "no framework"}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
