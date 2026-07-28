import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";
import { login } from "@/services/auth/auth-service";

/** POST /api/auth/login — authenticate and set session cookie */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const result = await login(body);

    const response = jsonData(
      {
        user: result.user,
        expires_at: result.expires_at.toISOString(),
      },
      200,
    );

    response.cookies.set(
      SESSION_COOKIE_NAME,
      result.token,
      sessionCookieOptions(result.expires_at),
    );

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
