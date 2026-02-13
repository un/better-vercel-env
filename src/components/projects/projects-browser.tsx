"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
  const [isLoadingScopes, setIsLoadingScopes] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [scopesError, setScopesError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [scopeRefreshKey, setScopeRefreshKey] = useState(0);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);

  useEffect(() => {
    const loadScopes = async () => {
      setIsLoadingScopes(true);
      try {
        setScopesError(null);
        const response = await fetch("/api/vercel/scopes");
        if (!response.ok) {
          setScopesError("Unable to load scopes. Please retry.");
          return;
        }

        const payload = (await response.json()) as ScopesResponse;
        const fetchedScopes = payload.data?.scopes ?? [];
        setScopes(fetchedScopes);
        setActiveScopeId(fetchedScopes[0]?.id ?? null);
      } catch {
        setScopes([]);
        setScopesError("Unable to load scopes. Please retry.");
      } finally {
        setIsLoadingScopes(false);
      }
    };

    void loadScopes();
  }, [scopeRefreshKey]);

  useEffect(() => {
    if (!activeScopeId) {
      return;
    }

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        setProjectsError(null);
        const params = new URLSearchParams({ scopeId: activeScopeId });
        if (search) {
          params.set("search", search);
        }

        const response = await fetch(`/api/vercel/projects?${params.toString()}`);
        if (!response.ok) {
          setProjects([]);
          setProjectsError("Unable to load projects. Please retry.");
          return;
        }

        const payload = (await response.json()) as ProjectsResponse;
        setProjects(payload.data?.projects ?? []);
      } catch {
        setProjects([]);
        setProjectsError("Unable to load projects. Please retry.");
      } finally {
        setIsLoadingProjects(false);
      }
    };

    void loadProjects();
  }, [activeScopeId, search, projectsRefreshKey]);

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
          {isLoadingScopes ? (
            <div className="space-y-2">
              <div className="h-12 animate-pulse rounded-md bg-muted" />
              <div className="h-12 animate-pulse rounded-md bg-muted" />
            </div>
          ) : null}
          {scopesError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{scopesError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setScopeRefreshKey((value) => value + 1)}
              >
                Retry
              </Button>
            </div>
          ) : null}
          {[...groupedScopes.personal, ...groupedScopes.teams].map((scope) => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setActiveScopeId(scope.id)}
              disabled={isLoadingProjects}
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
            disabled={isLoadingProjects}
          />
        </div>
        <div className="space-y-2">
          {isLoadingProjects ? <div className="h-10 animate-pulse rounded-md bg-muted" /> : null}
          {projectsError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{projectsError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setProjectsRefreshKey((value) => value + 1)}
              >
                Retry
              </Button>
            </div>
          ) : null}
          {!isLoadingProjects && !projectsError && projects.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              No projects found for this scope.
            </div>
          ) : null}
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/env?scopeId=${encodeURIComponent(activeScopeId ?? "")}`}
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
