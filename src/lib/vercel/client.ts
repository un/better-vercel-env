import { Vercel } from "@vercel/sdk";
import type { NextRequest } from "next/server";

import { getSessionIdFromRequest } from "@/lib/session/session-cookie";
import { sessionTokenStore } from "@/lib/session/token-session-store";

export class SessionAuthError extends Error {
  readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "SessionAuthError";
  }
}

export function createVercelClientFromToken(token: string): Vercel {
  return new Vercel({ bearerToken: token });
}

export function getSessionTokenFromRequest(request: NextRequest): string {
  const sessionId = getSessionIdFromRequest(request);

  if (!sessionId) {
    throw new SessionAuthError();
  }

  const token = sessionTokenStore.getToken(sessionId);

  if (!token) {
    throw new SessionAuthError();
  }

  return token;
}

export function createVercelClientFromRequest(request: NextRequest): Vercel {
  const token = getSessionTokenFromRequest(request);
  return createVercelClientFromToken(token);
}
