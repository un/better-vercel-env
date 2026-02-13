import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "vbe_session";

const SESSION_COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function getSessionIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    ...SESSION_COOKIE_BASE,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    ...SESSION_COOKIE_BASE,
    expires: new Date(0),
  });
}
