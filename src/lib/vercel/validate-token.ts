import { createVercelClientFromToken } from "@/lib/vercel/client";

interface ValidationSuccess {
  ok: true;
}

interface ValidationFailure {
  ok: false;
  status: number;
  message: string;
}

export type TokenValidationResult = ValidationSuccess | ValidationFailure;

export async function validateVercelToken(token: string): Promise<TokenValidationResult> {
  const client = createVercelClientFromToken(token);

  try {
    const user = await client.user.getAuthUser();

    if (!user) {
      return {
        ok: false,
        status: 401,
        message: "Unable to verify this token.",
      };
    }

    return { ok: true };
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    if (statusCode === 401 || statusCode === 403) {
      return {
        ok: false,
        status: statusCode,
        message: "Token is invalid or lacks required access.",
      };
    }

    return {
      ok: false,
      status: 500,
      message: "Unable to validate token right now. Please retry.",
    };
  }
}
