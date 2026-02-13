import { AppShell } from "@/components/app-shell";
import { ProjectsBrowser } from "@/components/projects/projects-browser";

export default function ProjectsPage() {
  return (
    <AppShell
      heading="Select a project"
      subheading="Choose an account scope and project to open the env matrix editor."
    >
      <ProjectsBrowser />
    </AppShell>
  );
}
