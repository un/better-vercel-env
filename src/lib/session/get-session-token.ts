import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/session/session-cookie";
import { sessionTokenStore } from "@/lib/session/token-session-store";

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  return sessionTokenStore.getToken(sessionId);
}
