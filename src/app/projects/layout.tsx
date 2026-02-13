import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSessionToken } from "@/lib/session/get-session-token";

export default async function ProjectsLayout({ children }: { children: ReactNode }) {
  const token = await getSessionToken();

  if (!token) {
    redirect("/");
  }

  return children;
}
