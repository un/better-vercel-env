import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "bad_request",
        message: "Use /api/vercel/project-snapshot for CLI-backed environment data.",
      },
    },
    { status: 410 },
  );
}
