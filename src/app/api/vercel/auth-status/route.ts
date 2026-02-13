import { NextResponse } from "next/server";

import { getVercelCliAuthStatus } from "@/lib/vercel-cli";

export async function GET(): Promise<NextResponse> {
  const status = await getVercelCliAuthStatus();

  return NextResponse.json({
    ok: true,
    data: {
      authenticated: status.authenticated,
      username: status.identity?.username ?? null,
      activeScope: status.identity?.activeScope ?? null,
      message: status.message,
    },
  });
}
