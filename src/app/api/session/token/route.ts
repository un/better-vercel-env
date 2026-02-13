import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "bad_request",
        message: "Token submission is no longer supported. Run `vercel login` and refresh onboarding.",
      },
    },
    { status: 410 },
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    data: {
      authenticated: false,
    },
  });
}
