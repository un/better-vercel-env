import { AppShell } from "@/components/app-shell";
import { EditorSnapshotLoader } from "@/components/editor/editor-snapshot-loader";

interface ProjectEditorPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    scopeId?: string;
  }>;
}

export default async function ProjectEditorPage({
  params,
  searchParams,
}: ProjectEditorPageProps) {
  const { projectId } = await params;
  const { scopeId } = await searchParams;

  return (
    <AppShell
      heading="Environment matrix editor"
      subheading={`Project ${projectId}. Reviewing baseline snapshot before editing.`}
    >
      {scopeId ? (
        <EditorSnapshotLoader projectId={projectId} scopeId={scopeId} />
      ) : (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Missing scopeId. Return to projects and reopen the editor.
        </div>
      )}
    </AppShell>
  );
}
