import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  clearSessionCookie,
  createSessionId,
  getSessionIdFromRequest,
  setSessionCookie,
} from "@/lib/session/session-cookie";
import { sessionTokenStore } from "@/lib/session/token-session-store";
import { validateVercelToken } from "@/lib/vercel/validate-token";

const tokenSchema = z.object({
  token: z.string().trim().min(20).max(256),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = tokenSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "bad_request",
          message: "Token format is invalid.",
        },
      },
      { status: 400 },
    );
  }

  const validationResult = await validateVercelToken(parsed.data.token);

  if (!validationResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: validationResult.status === 500 ? "internal_error" : "unauthorized",
          message: validationResult.message,
        },
      },
      { status: validationResult.status },
    );
  }

  const existingSessionId = getSessionIdFromRequest(request);
  const sessionId = existingSessionId ?? createSessionId();

  sessionTokenStore.setToken(sessionId, parsed.data.token);

  const response = NextResponse.json({
    ok: true,
    data: {
      authenticated: true,
    },
  });

  setSessionCookie(response, sessionId);

  return response;
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const sessionId = getSessionIdFromRequest(request);

  if (sessionId) {
    sessionTokenStore.clearSession(sessionId);
  }

  const response = NextResponse.json({
    ok: true,
    data: {
      authenticated: false,
    },
  });

  clearSessionCookie(response);

  return response;
}
